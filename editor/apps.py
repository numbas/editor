from django.apps import AppConfig

class EditorAppConfig(AppConfig):
    name = 'editor'
    def ready(self):
        super().ready()

        from notifications.models import Notification
        from django.db.models import signals
        from django.dispatch import receiver
        from .email_notification import NotificationEmail

        @receiver(signals.pre_save, sender=Notification)
        def email_notification(instance, **kwargs):
            print("notification",instance)
            if instance.emailed:
                return
            NotificationEmail(instance).send()

        self.email_notification = email_notification
