# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

def old_to_new_questions(apps, schema_editor):
    Question = apps.get_model('editor','Question')
    NewQuestion = apps.get_model('editor','NewQuestion')
    EditorItem = apps.get_model('editor','EditorItem')
    NewStampOfApproval = apps.get_model('editor','NewStampOfApproval')
    TaggedQuestion = apps.get_model('editor','TaggedQuestion')

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for q in Question.objects.all():
        nq = NewQuestion()
        nq.pk = q.pk

        ei = EditorItem()

        ei.name = q.name
        ei.slug = q.slug
        ei.filename = q.filename
        ei.author = q.author
        ei.public_access = q.public_access
        ei.licence = q.licence

        ei.content = q.content
        ei.metadata = q.metadata

        ei.created = q.created
        ei.last_modified = q.last_modified

        ei.published = q.published
        ei.published_date = q.published_date

        ei.ability_level_start = q.ability_level_start
        ei.ability_level_end = q.ability_level_end

        ei.save()
        nq.editoritem = ei
        nq.save()

        if q.current_stamp:
            ns = NewStampOfApproval()
            ns.object = ei
            ns.user = q.current_stamp.user
            ns.status = q.current_stamp.status
            ns.date = q.current_stamp.date
            ns.save()
            ei.current_stamp = ns

        for al in q.ability_levels.all():
            ei.ability_levels.add(al)

        for s in q.subjects.all():
            ei.subjects.add(s)

        for t in q.topics.all():
            ei.topics.add(t)

        for r in q.resources.all():
            nq.resources.add(r)

        for e in q.extensions.all():
            nq.extensions.add(e)

        ei.save()
        nq.save()

    for q in Question.objects.all():
        if q.copy_of:
            nq = NewQuestion.objects.get(pk=q.pk)
            nq.editoritem.copy_of = NewQuestion.objects.get(pk=q.copy_of.pk).editoritem
            nq.save()

def remove_new_questions(apps, schema_editor):
    for name in ['NewQuestion','NewExam','EditorItem','TaggedItem','Access','NewStampOfApproval']:
        model = apps.get_model('editor',name)
        model.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0019_newexam_locale'),
    ]

    operations = [
            migrations.RunPython(old_to_new_questions,remove_new_questions),
            migrations.RunSQL(
    """
        SELECT ei.id,et.id,ct.id 
        FROM editor_taggedquestion as tq 
        JOIN editor_editortag as et ON tq.tag_id=et.id 
        JOIN editor_question AS q ON q.id=tq.object_id 
        JOIN editor_newquestion AS nq on nq.id=q.id 
        JOIN editor_editoritem AS ei ON ei.id=nq.editoritem_id
        JOIN django_content_type as ct ON ct.app_label="editor" AND ct.model="editoritem"
    """,
    """
        DELETE FROM editor_taggeditem
    """)
    ]
