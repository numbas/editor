"""
For more information on this file, see
https://docs.djangoproject.com/en/2.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.0/ref/settings/
"""

import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'lk9_ggyjkq11t#u1cykf@u36577z8t!rr@(x#4a%qobny+vp8&'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# Application definition

INSTALLED_APPS = [
    'accounts',
    'editor',

    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',

    'django.contrib.humanize',
    'sanitizer',
    'notifications',
    'analytical',
    'reversion',
    'registration',
    'django_tables2',
    'taggit',
    'el_pagination',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'numbas.urls'

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
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.static",
                "editor.context_processors.global_settings",
                "editor.context_processors.site_root",
            ],
        },
    },
]

# Database
# https://docs.djangoproject.com/en/2.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/2.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Password hashing
# https://docs.djangoproject.com/en/4.1/ref/settings/#std-setting-PASSWORD_HASHERS
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.ScryptPasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]


# Internationalization
# https://docs.djangoproject.com/en/2.0/topics/i18n/

LANGUAGE_CODE = 'en-gb'

TIME_ZONE = 'Europe/London'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.0/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = 'editor/static'

SITE_TITLE = 'Numbas development'
SITE_ID = 1

MATHJAX_URL = 'https://cdn.jsdelivr.net/npm/mathjax@2'

MEDIA_ROOT = 'media'
MEDIA_URL = '/media/'

GLOBAL_SETTINGS = {
    'NUMBAS_PATH': 'C:\\Users\\Lapin\\OneDrive - Newcastle University\\Documents\\html\\compiler',
    'PREVIEW_PATH': 'editor/static/previews',
    'PREVIEW_URL': '/static/previews/',    # a URL which serves files from PREVIEW_PATH
    'HELP_URL': 'https://docs.numbas.org.uk/en/latest/',        # the URL of the Numbas webdocs
    'PYTHON_EXEC': 'C:\\Users\\Lapin\\OneDrive - Newcastle University\\Documents\\html\\numbas_venv\\Scripts\\python.exe',
    'NUMBAS_THEMES': [('Standard', 'default'), ('Printable worksheet', 'worksheet'), ('School', 'school')],
    'NUMBAS_LOCALES': [
        ('English', 'en-GB'),
        ('Afrikaans (92% complete)', 'af-ZA'),
        ('Bahasa Indonesia (83% complete)', 'in-ID'),
        ('Deutsch (91% complete)', 'de-DE'),
        ('Español (83% complete)', 'es-ES'),
        ('Français (76% complete)', 'fr-FR'),
        ('Italiano (53% complete)', 'it-IT'),
        ('Nederlands (87% complete)', 'nl-NL'),
        ('Norsk bokmål (56% complete)', 'nb-NO'),
        ('Polski (18% complete)', 'pl-PL'),
        ('Português brasileiro (65% complete)', 'pt-BR'),
        ('Shqip (53% complete)', 'sq-AL'),
        ('Svenska (61% complete)', 'sv-SE'),
        ('Tiếng Việt (88% complete)', 'vi-VN'),
        ('Türkçe (13% complete)', 'tr-TR'),
        ('עִבְרִית (20% complete)', 'he-IL'),
        ('中文 (75% complete)', 'zh-CN'),
        ('日本語 (38% complete)', 'ja-JP'),
        ('ﺎﻠﻋﺮﺒﻳﺓ (80% complete)', 'ar-SA'),
    ],
    #Uncomment the lines below and provide paths to minification tools to minify javascript and CSS files
    #'MINIFIER_PATHS': {
    #    'js': 'uglifyjs',
    #    'css': 'uglifycss',
    #}
}

EVERYTHING_VISIBLE = False  # Set this to True to allow every user to see all content, regardless of access settings

ALLOW_REGISTRATION = True
ACCOUNT_ACTIVATION_DAYS = 10

LOGIN_REDIRECT_URL = '/'
LOGIN_URL = '/login/'
CAN_LOGOUT = True
CAN_CHANGE_PASSWORD = True
LOGOUT_REDIRECT_URL = '/'

sys.path.append(os.path.join(GLOBAL_SETTINGS['NUMBAS_PATH'],'bin'))

SANITIZER_ALLOWED_TAGS = ['a', 'p', 'img','br','strong','em','div','code','i','b', 'ul', 'ol', 'li', 'table','thead','tbody','td','th','tr', 'h1','h2','h3','h4','h5','h6', 'hr']
SANITIZER_ALLOWED_ATTRIBUTES = ['href','title']

DEFAULT_FROM_EMAIL = ''

# Must users be able to view all the questions in an exam in order to view the exam?
EXAM_ACCESS_REQUIRES_QUESTION_ACCESS = False

# The prefix for all URLs on this server.
# If the editor is accessed through https://mydomain.com/editor/, then URL_PREFIX should be '/editor/'.
# If it's accessed from the top of the domain, then it should be '/'.
URL_PREFIX = '/'

# CSS variables for the interface.
CSS_VARIABLES = {
    'brand-color': '#acdeff',   # The colour of the top nav bar.
}

# Settings for the lockdown app
LOCKDOWN_APP = {
    # Salt for encrypted links to launch the lockdown app.
    # This is built into the lockdown app, so shouldn't change unless you have your own version.
    'salt': '45ab2cf2e139c01f8447d17dc653d585',
}
