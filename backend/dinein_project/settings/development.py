from .base import *

# Development configurations overrides
DEBUG = True
ALLOWED_HOSTS = env('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', '0.0.0.0'])

# Logging overrides (more verbose for dev)
LOGGING['loggers']['django']['level'] = 'INFO'
LOGGING['loggers']['dinein.auth']['level'] = 'DEBUG'
LOGGING['loggers']['dinein.reservation']['level'] = 'DEBUG'
LOGGING['loggers']['dinein.inventory']['level'] = 'DEBUG'
LOGGING['loggers']['dinein.notification']['level'] = 'DEBUG'
LOGGING['loggers']['dinein.audit']['level'] = 'DEBUG'

# Enable synchronous Celery task execution in dev mode to bypass Redis dependency
CELERY_TASK_ALWAYS_EAGER = True
