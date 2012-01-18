from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_http_methods
from editor.models import Exam, ExamForm

@require_http_methods(["GET", "POST"])
def detail(request, exam_id):
    e = get_object_or_404(Exam, pk=exam_id)
    form = ExamForm(instance=e)
    return render(request, 'exams/detail.html', {'exam': e, 'form': form})