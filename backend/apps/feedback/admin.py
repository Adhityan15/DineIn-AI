from django.contrib import admin
from apps.feedback.models import (
    TopicCategory,
    SentimentKeyword,
    CustomerReview,
    ReviewInsight,
    ReviewResponse,
    ReviewAttachment,
    ReputationSnapshot,
    AIRecommendation
)

@admin.register(TopicCategory)
class TopicCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'created_at')
    search_fields = ('name', 'code')


@admin.register(SentimentKeyword)
class SentimentKeywordAdmin(admin.ModelAdmin):
    list_display = ('keyword', 'sentiment_type', 'created_at')
    search_fields = ('keyword',)
    list_filter = ('sentiment_type',)


class ReviewInsightInline(admin.StackedInline):
    model = ReviewInsight
    extra = 0


class ReviewResponseInline(admin.TabularInline):
    model = ReviewResponse
    extra = 0


class ReviewAttachmentInline(admin.TabularInline):
    model = ReviewAttachment
    extra = 0


@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'branch', 'rating', 'source', 'is_analyzed', 'priority_score', 'created_at')
    search_fields = ('author_name', 'comment', 'external_review_id')
    list_filter = ('source', 'rating', 'is_analyzed', 'branch')
    inlines = [ReviewInsightInline, ReviewResponseInline, ReviewAttachmentInline]


@admin.register(ReputationSnapshot)
class ReputationSnapshotAdmin(admin.ModelAdmin):
    list_display = ('branch', 'date', 'reputation_score', 'rating_avg', 'sentiment_index', 'nps_score', 'total_reviews')
    list_filter = ('branch', 'date')
    date_hierarchy = 'date'


@admin.register(AIRecommendation)
class AIRecommendationAdmin(admin.ModelAdmin):
    list_display = ('recommendation_type', 'branch', 'impact_score', 'is_active', 'created_at')
    list_filter = ('recommendation_type', 'branch', 'is_active')
    search_fields = ('content',)
