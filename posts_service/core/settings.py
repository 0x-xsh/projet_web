import os
import warnings
from datetime import timedelta
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise Exception("SECRET_KEY environment variable is required")

# JWT Secret Key - Use a separate key for JWT tokens
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    warnings.warn(
        "JWT_SECRET_KEY not found in environment variables. Using Django SECRET_KEY as fallback. "
        "For production, it's recommended to set a separate JWT_SECRET_KEY for better security.",
        UserWarning
    )
    JWT_SECRET_KEY = SECRET_KEY

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = bool(os.environ.get("DEBUG", default=0))

# Replace the environment variable based setting with an explicit list
ALLOWED_HOSTS = ['*', 'localhost', '127.0.0.1', 'posts_service', 'posts_service:8000', 'posts-service', 'posts-service:8000', 'projet_web-posts_service-1', 'projet_web-posts_service-1:8000']  # Added hosts with port numbers

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    # Local apps
    'posts',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.SecurityHeadersMiddleware',  # Add custom security headers
]

ROOT_URLCONF = 'core.urls'

# Add TEMPLATES setting
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

# Add WSGI_APPLICATION setting
WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': os.environ.get('SQL_ENGINE', 'django.db.backends.postgresql'),
        'NAME': os.environ.get('SQL_DATABASE', 'microservices_db'),
        'USER': os.environ.get('SQL_USER', 'postgres'),
        'PASSWORD': os.environ.get('SQL_PASSWORD', 'postgres'),
        'HOST': os.environ.get('SQL_HOST', 'db'),
        'PORT': os.environ.get('SQL_PORT', '5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'posts.authentication.JWTAuthentication',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'SIGNING_KEY': JWT_SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS settings - only needed for internal services and gateway
CORS_ALLOWED_ORIGINS = [
    "http://ingress-nginx-controller.ingress-nginx.svc.cluster.local",
    "https://ingress-nginx-controller.ingress-nginx.svc.cluster.local",
]

# The gateway handles external CORS
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
]
CORS_ALLOW_HEADERS = [
    'Authorization',
    'Content-Type',
    'X-Requested-With',
]

# Static files settings
STATIC_URL = '/static/'  # Updated with trailing slash

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Auth service URL
AUTH_SERVICE_URL = os.environ.get('AUTH_SERVICE_URL', 'http://auth_service:8000')
# Users service URL
USERS_SERVICE_URL = os.environ.get('USERS_SERVICE_URL', 'http://users_service:8000') 