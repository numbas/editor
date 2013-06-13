from django.conf import settings

def global_settings(request):
    return {
        'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL'],
		'ALLOW_REGISTRATION': settings.ALLOW_REGISTRATION,
		'CAN_LOGOUT': settings.CAN_LOGOUT,
		'CAN_CHANGE_PASSWORD': settings.CAN_CHANGE_PASSWORD,
		'SITE_TITLE': settings.SITE_TITLE
    }
