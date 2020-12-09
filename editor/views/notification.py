from django import http
from django.views import generic
from django.shortcuts import get_object_or_404, render
from django.template import loader
from notifications.models import Notification
import notifications.views

class OpenNotification(generic.RedirectView):
    def get_redirect_url(self, *args, **kwargs):
        notification = get_object_or_404(Notification, pk=kwargs.get('pk'))
        notification.mark_as_read()

        return notification.target.get_absolute_url()+'#editing-history'

class UnreadNotificationsList(notifications.views.UnreadNotificationsList):
    paginate_by = 5
    template_name = 'notifications/list_dropdown.html'
    def render_to_response(self, context, **kwargs):
        template = loader.select_template(self.get_template_names())
        html = template.render(context, self.request)
        unread = self.request.user.notifications.unread()
        num_unread = unread.count()
        data = {
            'html': html,
            'num_unread': num_unread,
            'last_notification': unread.first().timestamp if num_unread>0 else None,
        }
        return http.JsonResponse(data)
