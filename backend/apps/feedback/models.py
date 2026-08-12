import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import BaseModel, Branch
from apps.inventory.models import MenuItem

class TopicCategory(BaseModel):
    """
    Categorized operational domains, e.g. Food Quality, Service, Cleanliness, Pricing, Waiting Time.
    """
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=100, unique=True)

    class Meta:
        verbose_name_plural = "Topic Categories"

    def __str__(self):
        return self.name


class SentimentKeyword(BaseModel):
    """
    Extracted positive or negative keywords/phrases mapped to their sentiment charge.
    """
    SENTIMENT_CHARGES = (
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    )
    keyword = models.CharField(max_length=255, unique=True)
    sentiment_type = models.CharField(max_length=20, choices=SENTIMENT_CHARGES)

    def __str__(self):
        return f"{self.keyword} ({self.sentiment_type})"


class CustomerReview(BaseModel):
    """
    Feedback records generated internally or imported from third-party aggregators.
    """
    SOURCE_CHOICES = (
        ('internal', 'Internal Portal'),
        ('google_maps', 'Google Maps'),
        ('yelp', 'Yelp'),
        ('tripadvisor', 'TripAdvisor'),
    )

    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_reviews'
    )
    author_name = models.CharField(max_length=255, default='Anonymous')
    author_avatar_url = models.URLField(max_length=500, null=True, blank=True)
    
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='internal')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    visit_date = models.DateField(null=True, blank=True)
    
    external_review_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    is_analyzed = models.BooleanField(default=False)
    priority_score = models.FloatField(default=0.0) # Calculated AI severity score (0.0 to 100.0)
    
    menu_items = models.ManyToManyField(MenuItem, related_name='reviews', blank=True)
    sentiment = models.CharField(max_length=20, default='neutral')
    confidence_score = models.FloatField(default=0.0)
    categories = models.ManyToManyField(TopicCategory, related_name='reviews_category', blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['branch', 'source']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.author_name} ({self.rating}★) - {self.source}"


class ReviewInsight(BaseModel):
    """
    Deep AI-generated review intelligence, sentiments, classifications, and emotions.
    """
    SENTIMENT_CHOICES = (
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    )

    EMOTION_CHOICES = (
        ('Happy', 'Happy'),
        ('Angry', 'Angry'),
        ('Frustrated', 'Frustrated'),
        ('Disappointed', 'Disappointed'),
        ('Excited', 'Excited'),
        ('Neutral', 'Neutral'),
    )

    review = models.OneToOneField(CustomerReview, on_delete=models.CASCADE, related_name='insight')
    sentiment = models.CharField(max_length=15, choices=SENTIMENT_CHOICES, default='neutral')
    sentiment_score = models.FloatField(default=0.0) # Scale of -1.0 to +1.0
    emotion = models.CharField(max_length=20, choices=EMOTION_CHOICES, default='Neutral')
    
    topics = models.ManyToManyField(TopicCategory, related_name='insights', blank=True)
    
    # Store dynamic keywords directly inside JSON fields for performant rendering
    positive_keywords = models.JSONField(default=list, blank=True)
    negative_keywords = models.JSONField(default=list, blank=True)
    
    suggested_improvements = models.TextField(null=True, blank=True)
    ai_summary = models.TextField(null=True, blank=True)
    manager_action_items = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Insight for Review {self.review.id} - Sentiment: {self.sentiment}"


class ReviewResponse(BaseModel):
    """
    Official responses logged by managers to individual reviews.
    """
    review = models.ForeignKey(CustomerReview, on_delete=models.CASCADE, related_name='responses')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='review_responses')
    response_text = models.TextField()

    def __str__(self):
        return f"Response by {self.user.email} to {self.review.author_name}"


class ReviewAttachment(BaseModel):
    """
    Uploaded pictures or media links detailing the customer experience.
    """
    review = models.ForeignKey(CustomerReview, on_delete=models.CASCADE, related_name='attachments')
    file_url = models.URLField(max_length=500)
    file_type = models.CharField(max_length=50, default='image') # image, video

    def __str__(self):
        return f"Attachment ({self.file_type}) for Review {self.review.id}"


class ReputationSnapshot(BaseModel):
    """
    Daily aggregated reputation scores and indices cached per branch.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='reputation_snapshots')
    date = models.DateField()
    
    reputation_score = models.FloatField(default=0.0) # 0.0 to 100.0
    rating_avg = models.FloatField(default=0.0)
    sentiment_index = models.FloatField(default=0.0) # Composite percentage ratio positive vs negative
    nps_score = models.FloatField(default=0.0) # Net Promoter Score index
    total_reviews = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date']
        unique_together = ('branch', 'date')

    def __str__(self):
        return f"{self.branch.name} Reputation Snapshot - {self.date}: {self.reputation_score}"


class AIRecommendation(BaseModel):
    """
    AI-generated menus or operations suggestions based on review summaries.
    """
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='ai_recommendations')
    recommendation_type = models.CharField(max_length=50) # 'menu', 'service', 'cleanliness', 'pricing'
    content = models.TextField()
    impact_score = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.recommendation_type.upper()} Suggestion - Impact: {self.impact_score}/10"


class WeeklyFeedbackSummary(BaseModel):
    week_start = models.DateField()
    week_end = models.DateField()
    total_reviews = models.IntegerField(default=0)
    positive_reviews = models.IntegerField(default=0)
    neutral_reviews = models.IntegerField(default=0)
    negative_reviews = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    top_category = models.CharField(max_length=100, blank=True)
    trending_metric = models.CharField(max_length=255, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Weekly Feedback Summary: {self.week_start} to {self.week_end}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=CustomerReview)
def alert_low_rating_review(sender, instance, created, **kwargs):
    if created and instance.rating < 3:
        try:
            from apps.notifications.models import Notification
            if instance.branch and instance.branch.branch_manager:
                Notification.objects.create(
                    user=instance.branch.branch_manager,
                    title="Low Customer Review Alert",
                    message=f"Received a {instance.rating}-star review for {instance.branch.name}: '{instance.comment[:100]}...'",
                    notification_type='system'
                )
        except Exception:
            pass
