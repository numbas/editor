# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

def old_exams_to_new(apps, schema_editor):
    Exam = apps.get_model('editor','Exam')
    NewExam = apps.get_model('editor','NewExam')
    NewQuestion = apps.get_model('editor','NewQuestion')
    EditorItem = apps.get_model('editor','EditorItem')
    NewStampOfApproval = apps.get_model('editor','NewStampOfApproval')
    ExamQuestion = apps.get_model('editor','ExamQuestion')
    NewExamQuestion = apps.get_model('editor','NewExamQuestion')

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for e in Exam.objects.all():
        ne = NewExam()
        ne.pk = e.pk

        ei = EditorItem()

        ei.name = e.name
        ei.slug = e.slug
        ei.filename = e.filename
        ei.author = e.author
        ei.public_access = e.public_access
        ei.licence = e.licence

        ei.content = e.content
        ei.metadata = e.metadata

        ei.created = e.created
        ei.last_modified = e.last_modified

        ei.published = e.published
        ei.published_date = e.published_date

        ei.ability_level_start = e.ability_level_start
        ei.ability_level_end = e.ability_level_end

        ne.theme = e.theme
        ne.custom_theme = e.custom_theme
        ne.locale = e.locale

        ei.save()
        ne.editoritem = ei
        ne.save()

        if e.current_stamp:
            ns = NewStampOfApproval()
            ns.object = ei
            ns.user = e.current_stamp.user
            ns.status = e.current_stamp.status
            ns.date = e.current_stamp.date
            ns.save()
            ei.current_stamp = ns

        for al in e.ability_levels.all():
            ei.ability_levels.add(al)

        for s in e.subjects.all():
            ei.subjects.add(s)

        for t in e.topics.all():
            ei.topics.add(t)

        ei.save()
        ne.save()
    
    for eq in ExamQuestion.objects.all():
        neq = NewExamQuestion()
        neq.exam = NewExam.objects.get(pk=eq.exam.pk)
        neq.question = NewQuestion.objects.get(pk=eq.question.pk)
        neq.qn_order = eq.qn_order
        neq.save()


def remove_new_exams(apps,schema_editor):
    NewExam = apps.get_model('editor','NewExam')
    NewExam.objects.all().delete()
    NewExamQuestion = apps.get_model('editor','NewExamQuestion')
    NewExamQuestion.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0020_old_questions_to_new'),
    ]

    operations = [
            migrations.RunPython(old_exams_to_new,remove_new_exams)
    ]
