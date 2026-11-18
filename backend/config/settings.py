"""Configuración de Django. Los valores sensibles se leen de backend/.env."""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


def variable(nombre, por_defecto=None):
    """Devuelve una variable de .env o detiene Django con un mensaje claro."""
    valor = os.getenv(nombre, por_defecto)
    if valor is None or valor == '':
        raise ImproperlyConfigured(f'Falta la variable {nombre} en backend/.env')
    return valor


def lista(nombre, por_defecto=''):
    """Convierte 'a,b,c' en ['a', 'b', 'c']."""
    return [x.strip() for x in os.getenv(nombre, por_defecto).split(',') if x.strip()]


# --- Seguridad ---------------------------------------------------------------
SECRET_KEY = variable('SECRET_KEY')
DEBUG = os.getenv('DEBUG', 'False').lower() in ('1', 'true', 'yes')
ALLOWED_HOSTS = lista('ALLOWED_HOSTS', 'localhost,127.0.0.1')

# --- Aplicaciones -----------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Terceros
    'rest_framework',
    'django_filters',
    'drf_spectacular',
    'corsheaders',
    # Propias
    'retos',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # antes de CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- Base de datos MySQL ----------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': variable('DB_NAME'),
        'USER': variable('DB_USER'),
        'PASSWORD': variable('DB_PASSWORD'),
        'HOST': variable('DB_HOST', '127.0.0.1'),
        'PORT': variable('DB_PORT', '3309'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'TEST': {
            'NAME': f"test_{variable('DB_NAME')}",
            'CHARSET': 'utf8mb4',
            'COLLATION': 'utf8mb4_unicode_ci',
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- Idioma y zona horaria --------------------------------------------------
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- Django REST Framework y documentación ----------------------------------
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'API Seguimiento de Retos',
    'DESCRIPTION': 'Backend Django REST del proyecto Seguimiento de Retos.',
    'VERSION': '1.0.0',
}

# --- CORS: orígenes del frontend que pueden llamar a la API -----------------
CORS_ALLOWED_ORIGINS = lista('CORS_ALLOWED_ORIGINS', 'http://localhost:8100')
