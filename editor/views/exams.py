from django.shortcuts import render, get_object_or_404
from editor.models import Exam, ExamForm

def detail(request, exam_id):
    e = get_object_or_404(Exam, pk=exam_id)
    form = ExamForm()
    return render(request, 'exams/detail.html', {'exam': e, 'form': form})