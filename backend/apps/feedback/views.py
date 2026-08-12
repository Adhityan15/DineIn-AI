from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsManagerOrAbove
from apps.feedback.models import (
    TopicCategory,
    SentimentKeyword,
    CustomerReview,
    ReviewInsight,
    ReviewResponse,
    ReputationSnapshot,
    AIRecommendation,
    WeeklyFeedbackSummary
)
from apps.feedback.serializers import (
    TopicCategorySerializer,
    SentimentKeywordSerializer,
    CustomerReviewSerializer,
    ReviewResponseSerializer,
    ReputationSnapshotSerializer,
    AIRecommendationSerializer,
    WeeklyFeedbackSummarySerializer
)
from apps.feedback.services import AIService
from django.utils import timezone
from django.db.models import Avg, Count, Q
import csv
from django.http import HttpResponse

class TopicCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TopicCategory.objects.all()
    serializer_class = TopicCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class SentimentKeywordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SentimentKeyword.objects.all()
    serializer_class = SentimentKeywordSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerReviewViewSet(viewsets.ModelViewSet):
    queryset = CustomerReview.objects.all()
    serializer_class = CustomerReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        
        rating = self.request.query_params.get('rating')
        if rating:
            qs = qs.filter(rating=rating)

        source = self.request.query_params.get('source')
        if source:
            qs = qs.filter(source=source)

        sentiment = self.request.query_params.get('sentiment')
        if sentiment:
            qs = qs.filter(insight__sentiment=sentiment)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(comment__icontains=search) | Q(author_name__icontains=search))

        return qs

    def perform_create(self, serializer):
        review = serializer.save()
        # Automatically run AI analysis inline/async on creation
        AIService.analyze_review(review.id)
        # Update snapshot for the day
        AIService.calculate_reputation_snapshot(review.branch.id)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrAbove])
    def respond(self, request, pk=None):
        """
        Log official manager response to review.
        """
        review = self.get_object()
        serializer = ReviewResponseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(review=review, user=request.user)
            # Penalties recalculation since resolved/responded
            AIService.calculate_reputation_snapshot(review.branch.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrAbove])
    def analyze(self, request, pk=None):
        """
        Force manual review re-analysis.
        """
        review = self.get_object()
        insight = AIService.analyze_review(review.id)
        if insight:
            return Response({'status': 'success', 'message': 'AI analysis completed.'})
        return Response({'status': 'error', 'message': 'AI analysis failed.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrAbove])
    def bulk_analyze(self, request):
        """
        Analyze all un-analyzed reviews in bulk.
        """
        un_analyzed = CustomerReview.objects.filter(is_analyzed=False)
        count = 0
        for rev in un_analyzed:
            AIService.analyze_review(rev.id)
            count += 1
        return Response({'status': 'success', 'message': f'Analyzed {count} reviews.'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrAbove])
    def sync_places(self, request):
        """
        Sync Google Maps reviews using fallback adapter.
        """
        branch_id = request.data.get('branch_id')
        if not branch_id:
            return Response({'error': 'branch_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        count = AIService.sync_external_reviews(branch_id)
        return Response({'status': 'success', 'message': f'Synchronized {count} external reviews.'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsManagerOrAbove])
    def export_csv(self, request):
        """
        Export reviews list in CSV format.
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="dinein_reviews_export.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'Author', 'Rating', 'Source', 'Comment', 'Priority Score', 'Sentiment', 'Visit Date', 'Created At'])
        
        reviews = self.get_queryset()
        for r in reviews:
            sentiment = getattr(r, 'insight', None)
            sent_str = sentiment.sentiment if sentiment else 'Pending'
            writer.writerow([r.id, r.author_name, r.rating, r.source, r.comment, r.priority_score, sent_str, r.visit_date, r.created_at])
            
        return response

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def analytics(self, request):
        """
        Exposes advanced dashboard visual aggregates: rating averages, NPS, keywords cloud, hotspots.
        """
        branch_id = request.query_params.get('branch_id')
        if not branch_id:
            return Response({'error': 'branch_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        import uuid
        try:
            uuid.UUID(str(branch_id))
        except ValueError:
            return Response({'error': 'Invalid branch_id UUID format.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filters by branch
        reviews = CustomerReview.objects.filter(branch_id=branch_id)
        insights = ReviewInsight.objects.filter(review__branch_id=branch_id)

        total_reviews = reviews.count()
        if total_reviews == 0:
            return Response({
                'rating_avg': 0.0,
                'total_reviews': 0,
                'sentiment_breakdown': {'positive': 0, 'neutral': 0, 'negative': 0},
                'emotions': {},
                'complaint_hotspots': [],
                'recent_insights': []
            })

        rating_avg = reviews.aggregate(avg=Avg('rating'))['avg'] or 0.0
        
        # Sentiment breakdown percentages
        sentiments = insights.values('sentiment').annotate(cnt=Count('id'))
        sent_dict = {'positive': 0, 'neutral': 0, 'negative': 0}
        for s in sentiments:
            sent_dict[s['sentiment']] = s['cnt']

        # Emotions distribution
        emotions = insights.values('emotion').annotate(cnt=Count('id'))
        emo_dict = {}
        for e in emotions:
            emo_dict[e['emotion']] = e['cnt']

        # NPS score calculations
        promoters = reviews.filter(rating__gte=4).count()
        detractors = reviews.filter(rating__lte=2).count()
        nps_score = ((promoters - detractors) / total_reviews * 100.0)

        # Topic Distribution & Complaint hotspots (percentage of negative reviews in topic category)
        topics = TopicCategory.objects.filter(insights__review__branch_id=branch_id)
        hotspots = []
        for t in topics:
            total_topic = insights.filter(topics=t).count()
            negative_topic = insights.filter(topics=t, sentiment='negative').count()
            neg_pct = (negative_topic / total_topic * 100.0) if total_topic > 0 else 0.0
            hotspots.append({
                'topic': t.name,
                'total_mentions': total_topic,
                'negative_mentions': negative_topic,
                'negativity_rate': round(neg_pct, 1)
            })
        
        # Sort hotspots by negativity rate descending
        hotspots = sorted(hotspots, key=lambda x: x['negativity_rate'], reverse=True)

        # Extracted keyword statistics lists
        keywords_stats = {}
        for ins in insights:
            for kw in ins.positive_keywords:
                keywords_stats[kw] = keywords_stats.get(kw, 0) + 1
            for kw in ins.negative_keywords:
                keywords_stats[kw] = keywords_stats.get(kw, 0) + 1

        top_keywords = [{'keyword': k, 'count': v} for k, v in sorted(keywords_stats.items(), key=lambda x: x[1], reverse=True)[:15]]

        # Dynamic rating forecast logic: simple linear trend from past snapshots
        snapshots = ReputationSnapshot.objects.filter(branch_id=branch_id).order_by('date')[:15]
        forecast_rating = rating_avg
        if snapshots.count() >= 3:
            y1 = snapshots[0].rating_avg
            y2 = snapshots[snapshots.count()-1].rating_avg
            diff = (y2 - y1) / max(1, snapshots.count() - 1)
            forecast_rating = min(5.0, max(1.0, rating_avg + diff * 3))

        return Response({
            'rating_avg': round(rating_avg, 2),
            'total_reviews': total_reviews,
            'nps_score': round(nps_score, 1),
            'sentiment_breakdown': sent_dict,
            'emotions': emo_dict,
            'complaint_hotspots': hotspots,
            'top_keywords': top_keywords,
            'forecast_rating': round(forecast_rating, 2)
        })


class ReputationSnapshotViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReputationSnapshot.objects.all()
    serializer_class = ReputationSnapshotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        return qs.order_by('date')


class AIRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AIRecommendation.objects.filter(is_active=True)
    serializer_class = AIRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        active_branch = self.request.active_branch
        if active_branch:
            qs = qs.filter(branch=active_branch)
        return qs


class WeeklyFeedbackSummaryViewSet(viewsets.ModelViewSet):
    queryset = WeeklyFeedbackSummary.objects.all()
    serializer_class = WeeklyFeedbackSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().order_by('-week_start')


class CopilotViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='chat')
    def chat(self, request):
        message = request.data.get("message")
        if not message:
            return Response({"error": "Message parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        history = request.data.get("history", [])
        context = request.data.get("context", {})
        active_branch_id = request.data.get("active_branch_id")
        
        # Execute chat using CopilotService
        from apps.feedback.services import CopilotService
        res = CopilotService.execute_chat(
            user_message=message,
            history=history,
            active_branch_id=active_branch_id,
            context=context,
            user=request.user
        )
        
        return Response(res, status=status.HTTP_200_OK)
