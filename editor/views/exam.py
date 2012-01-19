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
        try:
            examfile = open('/space/najy2/tmp/exam.txt', 'r')
            e.content = examfile.read()
            examfile.close()
        except IOError:
            e.content = "Could not read from exam file."
            
        form = ExamForm(instance=e)
        
    return render(request, 'exam/edit.html', {'exam': e, 'form': form})

def new(request):
    if request.method == "POST":
        form = ExamForm(request.POST)
        if form.is_valid():
            try:
                examfile = open('/space/najy2/tmp/exam.txt', 'w')
                examfile.write(form.cleaned_data["content"])
                examfile.close()
                e = form.save()
            except IOError:
                save_error = "Could not save exam file."
                return render(request, 'exam/new.html', {'form': form, 'save_error': save_error})
#            return HttpResponseRedirect(reverse('exam_index'))
            return HttpResponseRedirect(reverse('exam_edit', args=(e.pk,)))
    else:
        form = ExamForm()
    
    return render(request, 'exam/new.html', {'form': form})