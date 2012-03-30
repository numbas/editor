from django.conf import settings

def globals(request):
    return {
        'HELP_URL': settings.GLOBAL_SETTINGS['HELP_URL']
	}
