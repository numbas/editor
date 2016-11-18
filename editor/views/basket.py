import json
from django.views.decorators.http import require_POST
from django.core.urlresolvers import reverse
from django.db import IntegrityError,transaction
from django.shortcuts import redirect
from django.http import HttpResponse
from django.template.loader import render_to_string
from editor.models import NewQuestion,NewExam
import editor
from accounts.models import BasketQuestion
from django.views import generic
import reversion

def render_basket(user):
    return render_to_string('basket/list.html',{'user':user})

@require_POST
def add_question_to_basket(request):
    id = request.POST.get('id')
    profile = request.user.userprofile
    try:
        with transaction.atomic():
            BasketQuestion(profile=profile,question=NewQuestion.objects.get(pk=id),qn_order=profile.question_basket.count()).save()
    except IntegrityError:
        pass
    return HttpResponse(render_basket(request.user))

@require_POST
def remove_question_from_basket(request):
    id = request.POST.get('id')

    profile = request.user.userprofile
    BasketQuestion.objects.filter(profile=profile,question=id).delete()
    return HttpResponse(render_basket(request.user))

class CreateExamFromBasketView(editor.views.exam.CreateView):
    template_name = 'exam/new_from_basket.html'
    form_class = editor.forms.CreateExamFromBasketForm

    def form_valid(self,form):
        with transaction.atomic(), reversion.create_revision():
            self.make_exam(form)
            self.exam.save()
            self.exam.set_question_groups([[bq.question.pk for bq in self.request.user.userprofile.basketquestion_set.all()]])
            if form.cleaned_data.get('clear_basket'):
                self.request.user.userprofile.question_basket.clear()

        return redirect(self.get_success_url())


@require_POST
def empty_question_basket(request):
    request.user.userprofile.question_basket.clear()
    return HttpResponse(render_basket(request.user))


class BasketView(generic.ListView):
    model = NewQuestion

    def get_queryset(self):
        if self.request.user.is_anonymous():
            query = []
        else:
            query = self.request.user.userprofile.basketquestion_set.all()
        return [bq.question.summary() for bq in query]

    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context['object_list'][:10]),
                                content_type='application/json',
                                **response_kwargs)
        else:
            raise Http404
