from rest_framework import serializers
from apps.feedback.models import (
    TopicCategory,
    SentimentKeyword,
    CustomerReview,
    ReviewInsight,
    ReviewResponse,
    ReviewAttachment,
    ReputationSnapshot,
    AIRecommendation,
    WeeklyFeedbackSummary
)

class TopicCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicCategory
        fields = ['id', 'name', 'code']


class SentimentKeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentimentKeyword
        fields = ['id', 'keyword', 'sentiment_type']


class ReviewInsightSerializer(serializers.ModelSerializer):
    topics = TopicCategorySerializer(many=True, read_only=True)

    class Meta:
        model = ReviewInsight
        fields = [
            'id', 'sentiment', 'sentiment_score', 'emotion', 
            'topics', 'positive_keywords', 'negative_keywords',
            'suggested_improvements', 'ai_summary', 'manager_action_items'
        ]


class ReviewResponseSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ReviewResponse
        fields = ['id', 'user', 'user_email', 'response_text', 'created_at']
        read_only_fields = ['user']


class ReviewAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewAttachment
        fields = ['id', 'file_url', 'file_type']


class CustomerReviewSerializer(serializers.ModelSerializer):
    insight = ReviewInsightSerializer(read_only=True)
    responses = ReviewResponseSerializer(many=True, read_only=True)
    attachments = ReviewAttachmentSerializer(many=True, read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = CustomerReview
        fields = [
            'id', 'branch', 'branch_name', 'customer', 'author_name', 
            'author_avatar_url', 'source', 'rating', 'comment', 
            'visit_date', 'external_review_id', 'is_analyzed', 
            'priority_score', 'menu_items', 'insight', 'responses', 
            'attachments', 'created_at'
        ]
        read_only_fields = ['is_analyzed', 'priority_score', 'external_review_id']


class ReputationSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReputationSnapshot
        fields = [
            'id', 'branch', 'date', 'reputation_score', 
            'rating_avg', 'sentiment_index', 'nps_score', 'total_reviews'
        ]


class AIRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIRecommendation
        fields = ['id', 'branch', 'recommendation_type', 'content', 'impact_score', 'is_active']


class WeeklyFeedbackSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyFeedbackSummary
        fields = [
            'id', 'week_start', 'week_end', 'total_reviews', 'positive_reviews',
            'neutral_reviews', 'negative_reviews', 'average_rating', 'top_category',
            'trending_metric', 'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']
