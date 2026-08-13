from .base import *
import dj_database_url

# Production environment configurations
DEBUG = False

# Render PostgreSQL configuration
db_from_env = dj_database_url.config(conn_max_age=600, ssl_require=True)
if db_from_env:
    DATABASES['default'] = db_from_env

# Restrict allowed hostnames
ALLOWED_HOSTS = env.list(
    'ALLOWED_HOSTS',
    default=['.onrender.com', 'localhost', '127.0.0.1']
)

# Trust Render Reverse Proxy HTTPS header
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CSRF Trusted Origins for Render
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['https://*.onrender.com']
)

# Security policies and HTTP headers
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True

# Celery task broker fallback when Redis is not provided on Render
if not env('REDIS_URL', default=''):
    CELERY_TASK_ALWAYS_EAGER = True