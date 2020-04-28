from django.apps import AppConfig

class EditorAppConfig(AppConfig):
    name = 'editor'
    def ready(self):
        super().ready()

        from notifications.models import Notification
        from django.db.models import signals
        from django.dispatch import receiver
        from .email_notification import StampNotificationEmail, EditorItemCommentNotificationEmail, ProjectCommentNotificationEmail
        from .models import EditorItem, Project, NewStampOfApproval, Comment

        @receiver(signals.pre_save, sender=Notification)
        def email_notification(instance, **kwargs):
            if instance.emailed:
                return
            instance.emailed = True
            if isinstance(instance.action_object, NewStampOfApproval):
                cls = StampNotificationEmail
            elif isinstance(instance.action_object, Comment):
                if isinstance(instance.target, EditorItem):
                    cls = EditorItemCommentNotificationEmail
                elif isinstance(instance.target, Project):
                    cls = ProjectCommentNotificationEmail
            else:
                instance.emailed = False
                return

            if cls:
                cls(instance).send()

        self.email_notification = email_notification
