from rest_framework.renderers import JSONRenderer

class CoreJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that wraps all API responses in a standard envelope:
    {
        "success": True/False,
        "message": "Description of the operation status",
        "data": { ... }
    }
    """
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response')
        
        # Default success flag based on status code
        success = True
        message = "Operation completed successfully."
        
        if response is not None:
            if response.status_code >= 400:
                success = False
                message = "An error occurred while processing the request."
            
            # Allow views to explicitly override success, message, and direct envelope control
            if isinstance(data, dict):
                if 'success' in data and 'message' in data:
                    # Already formatted by handler or exception handler
                    return super().render(data, accepted_media_type, renderer_context)
                
                # Check if payload contains pagination or direct DRF errors
                if 'results' in data:
                    # Pagination list format
                    envelope = {
                        "success": True,
                        "message": "Data retrieved successfully.",
                        "data": data
                    }
                    return super().render(envelope, accepted_media_type, renderer_context)
                
                # Extract message if explicitly passed in data
                if '_message' in data:
                    message = data.pop('_message')
                elif not success:
                    # Use detail or non_field_errors if present
                    if 'detail' in data:
                        message = data.get('detail')
                    elif 'non_field_errors' in data:
                        message = data.get('non_field_errors')[0]
                    else:
                        message = "Validation failed."
            
        envelope = {
            "success": success,
            "message": message,
            "data": data
        }
        
        return super().render(envelope, accepted_media_type, renderer_context)
