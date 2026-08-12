from .base import *

# Testing environment configurations
DEBUG = False
TESTING = True

# Accelerate user password operations during tests by using MD5 hashing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Use in-memory SQLite database to run tests quickly without needing container infrastructure
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable cache and Celery task execution delays during testing
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable logging spam during test runs
LOGGING['handlers']['console']['level'] = 'WARNING'
for logger_name in LOGGING['loggers']:
    LOGGING['loggers'][logger_name]['level'] = 'WARNING'

# Disable rate limiting during tests
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}
