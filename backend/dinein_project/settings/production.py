from .base import *

# Production environment configurations
DEBUG = False

# Render PostgreSQL
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        conn_max_age=600,
        ssl_require=True,
    )
}

# Restrict allowed hostnames
ALLOWED_HOSTS = env(
    'ALLOWED_HOSTS',
    default=['.onrender.com', 'localhost', '127.0.0.1']
)

# Strict security policies and HTTP headers
SECURE_SSL_REDIRECT = env('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True