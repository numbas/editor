from django.views import generic
from django.shortcuts import get_object_or_404
from notifications.models import Notification

class OpenNotification(generic.RedirectView):
    def get_redirect_url(self, *args, **kwargs):
        notification = get_object_or_404(Notification, pk=kwargs.get('pk'))
        notification.mark_as_read()

        return notification.target.get_absolute_url()
