from django.views.decorators.csrf import csrf_exempt
from django.views import generic
from django import http, forms
from django.urls import reverse_lazy, reverse
from django.core.exceptions import PermissionDenied
from pylti.common import LTIException
from django.shortcuts import render, redirect

from .lti import LTI
from .models import LTIContext
from editor.models import NewExam
import editor.views.exam

@csrf_exempt
def lti_launch(request, *args, **kwargs):
    lti = LTI(request, request_type='initial')
    try:
        lti.verify()
    except LTIException as e:
        return http.HttpResponseForbidden(e)

    # TODO: login required

    context = lti.context

    if lti.is_instructor:
        return redirect(reverse('lti_set_exam',kwargs={'pk':context.pk}))
    else:
        return redirect(reverse('lti_attempt',kwargs={'pk': context.pk}))
        return render(request, 'numbas_editor_lti/launch.html', {'lti': lti, 'is_instructor': lti.is_role('instructor')})

class LTIMixin(object):

    lti_request_type = 'any'

    def dispatch(self, request, *args, **kwargs):
        print("LTI mixin")
        self.lti = LTI(request, request_type=self.lti_request_type, context = self.get_lti_context())
        try:
            self.lti.verify()
            print("Verified")
        except LTIException as e:
            print("Error")
            return http.HttpResponseForbidden(e)
        return super().dispatch(request,*args,**kwargs)

    def get_lti_context(self):
        return self.get_object()

class SetExamView(LTIMixin, generic.UpdateView):
    model = LTIContext
    template_name = 'numbas_editor_lti/set_exam.html'
    fields = ['exam']

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args,**kwargs)
        context['last_viewed_exams'] = [i.item.exam for i in self.request.user.userprofile.last_viewed_items.exclude(item__exam=None).select_related('item__exam')]
        return context

    def get_success_url(self, *args, **kwargs):
        return reverse('lti_set_exam', kwargs={'pk': self.object.pk})

class AttemptView(LTIMixin, editor.views.exam.EmbedView):
    model = NewExam
    template_name = 'numbas_editor_lti/attempt.html'

    def get_object(self, *args, **kwargs):
        pk = self.kwargs.get(self.pk_url_kwarg)
        try:
            context = LTIContext.objects.get(pk=pk)
        except LTIContext.DoesNotExist:
            raise http.Http404("No context found matching the query")
        if not context.exam:
            raise http.Http404("LTI context doesn't have an associated exam yet.")
        exam = context.exam
        self.editoritem = exam.editoritem
        self.numbasobject = self.editoritem.as_numbasobject(self.request)
        return exam

    def get_lti_context(self):
        pk = self.kwargs.get('pk')
        return LTIContext.objects.get(pk=pk)

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['scorm_cmi'] = {
            'cmi.suspend_data': '',
            'cmi.objectives._count': 0,
            'cmi.interactions._count': 0,
            'cmi.learner_name': self.lti.name,
            'cmi.learner_id': self.lti.user_id,
            'cmi.location': '',
            'cmi.score.raw': 0,
            'cmi.score.scaled': 0,
            'cmi.score.min': 0,
            'cmi.score.max': 0,
            'cmi.total_time': 0,
            'cmi.success_status': '',
            'cmi.completion_status': 'not attempted',
            'cmi.entry': 'ab-initio',
            'cmi.mode': 'normal',
            'numbas.user_role': 'instructor' if self.lti.is_instructor else 'student',
        }
        context['lti_context'] = self.lti.context

        return context

class PostResultForm(forms.ModelForm):
    score = forms.CharField(required=True)

    class Meta:
        model = LTIContext
        fields = []

class PostResultView(LTIMixin, generic.UpdateView):
    model = LTIContext
    form_class = PostResultForm
    lti_request_type = 'session'

    def form_valid(self, form):
        print("Form valid")
        score = form.cleaned_data['score']
        success = self.lti.post_grade(score)
        if success:
            return http.HttpResponse('ok')
        else:
            return http.HttpResponseServerError('failed')

    def form_invalid(self, form):
        return http.HttpResponseBadRequest(str(form.errors)+'  '+str(self.request.POST))
