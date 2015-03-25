from django.core.urlresolvers import reverse
from django.views import generic
from django.shortcuts import get_object_or_404
from notifications.models import Notification
from editor.models import Question,Exam

class OpenNotification(generic.RedirectView):
    def get_redirect_url(self,*args,**kwargs):
        notification = get_object_or_404(Notification,pk=kwargs.get('pk'))
        notification.mark_as_read()

        target = notification.target

        if type(target) is Question:
            return reverse('question_edit', args=(target.pk,target.slug,))+'#editing-history'
        elif type(target) is Exam:
            return reverse('exam_edit', args=(target.pk,target.slug,))+'#editing-history'
