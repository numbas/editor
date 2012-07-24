from django.conf import settings

def global_settings(request):
    return {
        'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL'],
		'ALLOW_REGISTRATION': settings.ALLOW_REGISTRATION
    }
