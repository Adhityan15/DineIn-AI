import os
import environ
from pathlib import Path
from datetime import timedelta

# Define BASE_DIR
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Initialize environment variables config
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'django-insecure-default-change-me'),
    ALLOWED_HOSTS=(list, ['*']),
)

# Load environment file
env_file_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(env_file_path):
    environ.Env.read_env(env_file_path)

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Installed Applications
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-Party Libraries
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    
    # Core Domain Apps
    'apps.core.apps.CoreConfig',
    'apps.authentication.apps.AuthenticationConfig',
    
    # Domain Business Placeholder Apps
    'apps.reservation.apps.ReservationConfig',
    'apps.inventory.apps.InventoryConfig',
    'apps.staff.apps.StaffConfig',
    'apps.customer.apps.CustomerConfig',
    'apps.feedback.apps.FeedbackConfig',
    'apps.analytics.apps.AnalyticsConfig',
    'apps.notifications.apps.NotificationsConfig',
    'apps.vendor.apps.VendorConfig',
    'apps.reports.apps.ReportsConfig',
]

# Request Processing Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS headers must execute first
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.BranchIsolationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Custom audit logging middleware
    'apps.core.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'dinein_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'dinein_project.wsgi.application'
ASGI_APPLICATION = 'dinein_project.asgi.application'

# Database Configuration (MySQL / PostgreSQL / SQLite fallback)
DB_NAME = env('DB_NAME', default=None)
if DB_NAME:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': DB_NAME,
            'USER': env('DB_USER', default='root'),
            'PASSWORD': env('DB_PASSWORD', default=''),
            'HOST': env('DB_HOST', default='127.0.0.1'),
            'PORT': env('DB_PORT', default='3306'),
            'OPTIONS': {
                'charset': 'utf8mb4',
            }
        }
    }
else:
    db_config = env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
    if db_config.get('ENGINE') == 'django.db.backends.mysql':
        db_config['OPTIONS'] = {'charset': 'utf8mb4'}
    DATABASES = {
        'default': db_config
    }

# Custom User Model definition
AUTH_USER_MODEL = 'authentication.User'

# Password validation policies
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Regional and Localization Settings
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files management
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': (
        'apps.core.renderers.CoreJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_EXCEPTION_HANDLER': 'apps.core.exceptions.core_exception_handler',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '1000/min',
        'auth': '5/min',
    }
}

# OpenAPI Document Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'AI-Assisted Restaurant & Hospitality Management API',
    'DESCRIPTION': 'Enterprise API documentation for reservations, inventory, staff, and customer reviews.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]+',
}

# SimpleJWT Authentication configurations
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS configuration
CORS_ALLOW_ALL_ORIGINS = True  # Adjusted in production settings

# Celery & Redis task broker settings
REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default=REDIS_URL)
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default=REDIS_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_BROKER_TRANSPORT_OPTIONS = {'protocol': 2}

# Centralized Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        },
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'error.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        # App-specific domain loggers
        'dinein.auth': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'dinein.reservation': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'dinein.inventory': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'dinein.notification': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'dinein.audit': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'dinein.error': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        # Django framework logs
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Authentication Backends Configuration
AUTHENTICATION_BACKENDS = [
    'apps.authentication.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# Email Configuration
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=1025)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='no-reply@dinein.com')

# WhatsApp Business Cloud API Configuration
WHATSAPP_ACCESS_TOKEN = env('WHATSAPP_ACCESS_TOKEN', default='')
WHATSAPP_PHONE_NUMBER_ID = env('WHATSAPP_PHONE_NUMBER_ID', default='')
WHATSAPP_BUSINESS_ACCOUNT_ID = env('WHATSAPP_BUSINESS_ACCOUNT_ID', default='')

# Validate configuration on startup
if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID or not WHATSAPP_BUSINESS_ACCOUNT_ID:
    import warnings
    warnings.warn(
        "WhatsApp Business Cloud API configuration is incomplete: "
        f"WHATSAPP_ACCESS_TOKEN={'set' if WHATSAPP_ACCESS_TOKEN else 'MISSING'}, "
        f"WHATSAPP_PHONE_NUMBER_ID={'set' if WHATSAPP_PHONE_NUMBER_ID else 'MISSING'}, "
        f"WHATSAPP_BUSINESS_ACCOUNT_ID={'set' if WHATSAPP_BUSINESS_ACCOUNT_ID else 'MISSING'}. "
        "WhatsApp integrations will execute in simulation mode.",
        RuntimeWarning
    )

# Google Gemini API Configuration
GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
GEMINI_MODEL = env('GEMINI_MODEL', default='gemini-2.5-flash')
