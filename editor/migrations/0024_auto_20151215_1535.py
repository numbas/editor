# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

def copy_highlights(apps, schema_editor):
    Highlight = apps.get_model('editor','Highlight')
    ExamHighlight = apps.get_model('editor','ExamHighlight')
    QuestionHighlight = apps.get_model('editor','QuestionHighlight')
    NewExam = apps.get_model('editor','NewExam')
    NewQuestion = apps.get_model('editor','NewQuestion')

    Highlight._meta.get_field_by_name('date')[0].auto_now_add = False
    
    for eh in ExamHighlight.objects.all():
        h = Highlight()
        h.item = NewExam.objects.get(pk=eh.exam.pk).editoritem
        h.picked_by = eh.picked_by
        h.note = eh.note
        h.date = eh.date
        h.save()

    for qh in QuestionHighlight.objects.all():
        h = Highlight()
        h.item = NewQuestion.objects.get(pk=qh.question.pk).editoritem
        h.picked_by = qh.picked_by
        h.note = qh.note
        h.date = qh.date
        h.save()

def delete_new_highlights(apps, schema_editor):
    Highlight = apps.get_model('editor','Highlight')
    Highlight.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0023_highlight'),
    ]

    operations = [
            migrations.RunPython(copy_highlights,delete_new_highlights),
    ]
