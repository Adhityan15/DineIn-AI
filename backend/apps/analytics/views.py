from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.analytics.services import AIAnalyticsService

class AIAnalyticsPredictiveView(APIView):
    """
    Exposes real machine learning forecasts and NLP analysis calculations to the AI Analytics dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        branch_id = request.query_params.get('branch')
        algorithm = request.query_params.get('algorithm', 'linear_regression')
        
        # Ensure we fall back to None if branch is empty or 'undefined'
        if not branch_id or branch_id == 'undefined' or branch_id == 'null':
            branch_id = None
            
        try:
            kpis = AIAnalyticsService.get_kpis(branch_id)
            sales_chart = AIAnalyticsService.get_sales_chart_data(branch_id, algorithm)
            sentiment = AIAnalyticsService.get_sentiment_analysis(branch_id)
            inventory_depletions = AIAnalyticsService.get_inventory_depletions(branch_id)
            customer_segmentation = AIAnalyticsService.get_customer_segmentation()
            
            return Response({
                "kpis": kpis,
                "sales_chart": sales_chart,
                "sentiment": sentiment,
                "inventory_depletions": inventory_depletions,
                "customer_segmentation": customer_segmentation
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
