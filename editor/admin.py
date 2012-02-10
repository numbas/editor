from django.contrib import admin

from editor.models import Exam, ExamQuestion, Question

admin.site.register(Exam)
admin.site.register(ExamQuestion)
admin.site.register(Question)