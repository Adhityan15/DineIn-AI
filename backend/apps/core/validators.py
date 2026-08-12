import re
from django.core.exceptions import ValidationError

def validate_phone_number(value):
    """
    Validates that a phone number is standard 10 digits or contains country code.
    """
    pattern = re.compile(r'^\+?[0-9]{10,15}$')
    if not pattern.match(value):
        raise ValidationError("Phone number must contain between 10 and 15 digits and optionally start with '+'.")

def validate_gps_coordinates(latitude, longitude):
    """
    Validates standard GPS latitude and longitude ranges.
    """
    if latitude is not None and not (-90.0 <= float(latitude) <= 90.0):
        raise ValidationError("Latitude must be between -90 and 90 degrees.")
    if longitude is not None and not (-180.0 <= float(longitude) <= 180.0):
        raise ValidationError("Longitude must be between -180 and 180 degrees.")
