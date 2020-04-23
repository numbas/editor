from django.conf import settings
from django.contrib.sites.models import Site
from django.core.mail import send_mail
from django.template.loader import get_template

from accounts.email import unsubscribe_token

class NotificationEmail(object):
    plain_template = ''
    html_template = ''

    def __init__(self,notification):
        self.notification = notification
        self.editoritem = self.notification.target
        self.project = self.editoritem.project

    def get_context_data(self):
        site = Site.objects.get_current()

        context = {
            'notification': self.notification,
            'site': site,
            'domain': 'http://{}'.format(site.domain),
            'editoritem': self.editoritem,
            'project': self.project,
            'unsubscribe_token': unsubscribe_token(self.notification.recipient)
        }

        return context

    def get_subject(self):
        return "[{project}] {user} {verb} \"{item}\"".format(project=self.project.name, user=self.notification.actor.get_full_name(), verb=self.notification.verb, item=self.editoritem.name)

    def can_email(self):
        if not getattr(settings,'EMAIL_ABOUT_NOTIFICATIONS',False):
            return False
        recipient = self.notification.recipient
        return not recipient.userprofile.never_email

    def send(self):
        subject = self.get_subject()
        context = self.get_context_data()
        plain_content = get_template(self.plain_template).render(context)
        html_content = get_template(self.html_template).render(context)
        if self.can_email():
            send_mail(subject, plain_content, html_message=html_content, from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=(self.notification.recipient.email,))

class StampNotificationEmail(NotificationEmail):
    plain_template = 'notifications/email/stamp.txt'
    html_template = 'notifications/email/stamp.html'

    def get_context_data(self):
        stamp = self.notification.action_object
        context = super().get_context_data()
        context.update({
            'stamp': stamp,
        })
        return context

    def can_email(self):
        recipient = self.notification.recipient
        if not recipient.userprofile.email_about_stamps:
            return False
        return super().can_email()


class CommentNotificationEmail(NotificationEmail):
    plain_template = 'notifications/email/comment.txt'
    html_template = 'notifications/email/comment.html'

    def get_context_data(self):
        comment = self.notification.action_object
        context = super().get_context_data()
        context.update({
            'comment': comment,
        })
        return context

    def can_email(self):
        recipient = self.notification.recipient
        if not recipient.userprofile.email_about_comments:
            return False
        return super().can_email()

