from rest_framework.views import exception_handler
from rest_framework import status
from rest_framework.response import Response
import logging

logger = logging.getLogger('dinein.error')

def core_exception_handler(exc, context):
    """
    Custom exception handler to return error responses in the standard envelope:
    {
        "success": False,
        "message": "Error details",
        "data": { ... field-level errors or details ... }
    }
    """
    # Call DRF's default exception handler first to get the standard error response
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize DRF exception response
        data = response.data
        message = "An error occurred."
        
        if isinstance(data, dict):
            if 'detail' in data:
                message = data.get('detail')
                data = None
            elif 'non_field_errors' in data:
                message = data.get('non_field_errors')[0]
                data = None
            else:
                message = "Validation failed."
        elif isinstance(data, list):
            message = data[0]
            data = None
            
        response.data = {
            "success": False,
            "message": str(message),
            "data": data
        }
    else:
        # Unhandled Python Exception (e.g. DatabaseError, ValueError, AttributeError)
        # Log the error trace
        logger.exception(f"Unhandled Exception: {str(exc)}", extra={'context': str(context)})
        
        response = Response(
            {
                "success": False,
                "message": "Internal server error. Please try again later.",
                "data": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
