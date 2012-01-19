from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.http import HttpResponseRedirect
from django.core.urlresolvers import reverse
from editor.models import Exam, ExamForm

@require_http_methods(["GET", "POST"])
def edit(request, exam_id):
    e = get_object_or_404(Exam, pk=exam_id)
    if request.method == "POST":
        form = ExamForm(request.POST)
        if form.is_valid():
            form = ExamForm(request.POST, instance=e)
            form.save()
#            return HttpResponseRedirect(reverse('exam_edit', args=(exam_id,)))
            return HttpResponseRedirect(reverse('exam_index'))
    else:
        form = ExamForm(instance=e)
        
    return render(request, 'exam/edit.html', {'exam': e, 'form': form})

def new(request):
    if request.method == "POST":
        form = ExamForm(request.POST)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect(reverse('exam_index'))
    else:
        form = ExamForm()
    
    return render(request, 'exam/new.html', {'form': form})