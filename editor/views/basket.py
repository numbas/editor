import json
from django.views.decorators.http import require_POST
from django.core.urlresolvers import reverse
from django.db import IntegrityError,transaction
from django.shortcuts import redirect
from django.http import HttpResponse
from django.template.loader import render_to_string
from editor.models import Question,Exam
from accounts.models import BasketQuestion
from django.views import generic

def render_basket(user):
    return render_to_string('basket/list.html',{'user':user})

@require_POST
def add_question_to_basket(request):
    id = request.POST.get('id')
    profile = request.user.userprofile
    try:
        with transaction.atomic():
            BasketQuestion(profile=profile,question=Question.objects.get(pk=id),qn_order=profile.question_basket.count()).save()
    except IntegrityError:
        pass
    return HttpResponse(render_basket(request.user))

@require_POST
def remove_question_from_basket(request):
    id = request.POST.get('id')

    profile = request.user.userprofile
    BasketQuestion.objects.filter(profile=profile,question=id).delete()
    return HttpResponse(render_basket(request.user))

def create_exam_from_basket(request):
    e = Exam(author=request.user)
    e.save()
    e.set_questions([bq.question for bq in request.user.userprofile.basketquestion_set.all()])
    return redirect(reverse('exam_edit', args=(e.pk,e.slug)))

@require_POST
def empty_question_basket(request):
    request.user.userprofile.question_basket.clear()
    return HttpResponse(render_basket(request.user))


class BasketView(generic.ListView):
    model = Question

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
