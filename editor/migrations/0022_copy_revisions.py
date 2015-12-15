# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.core import exceptions

from django.core import serializers
from django.utils.encoding import force_text
import json


def copy_revisions(apps, schema_editor):
    Version = apps.get_model('reversion','Version')
    ContentType = apps.get_model('contenttypes','contenttype')
    NewExam = apps.get_model('editor','newexam')
    NewQuestion = apps.get_model('editor','newquestion')
    User = apps.get_model('auth','user')
    Theme = apps.get_model('editor','theme')
    Licence = apps.get_model('editor','licence')

    print("")
    exam_ct = ContentType.objects.get(app_label='editor',model='exam')
    question_ct = ContentType.objects.get(app_label='editor',model='question')
    newexam_ct = ContentType.objects.get(app_label='editor',model='newexam')
    newquestion_ct = ContentType.objects.get(app_label='editor',model='newquestion')
    editoritem_ct = ContentType.objects.get(app_label='editor',model='editoritem')
 
    for v in Version.objects.all():
        if v.content_type==exam_ct:
            data = v.serialized_data
            data = force_text(data.encode("utf8"))
            e = list(serializers.deserialize(v.format, data, ignorenonexistent=True))[0].object
            try:
                ne = NewExam.objects.get(pk=v.object_id)
            except NewExam.DoesNotExist:
                continue
            ei = ne.editoritem

            ei.name = e.name
            ei.author = User.objects.get(pk=e.author.pk)
            ei.content = e.content
            ei.created = e.created
            ei.content = e.content
            ei.share_uuid = q.share_uuid
            ei.last_modified = e.last_modified
            if e.licence:
                try:
                    ei.licence = Licence.objects.get(pk=e.licence.pk)
                except Licence.DoesNotExist:
                    pass
            ei.public_access = e.public_access
            ei.slug = e.slug
            ei.metadata = e.metadata

            ne.locale = e.locale
            ne.theme = e.theme
            try:
                if e.custom_theme:
                    ne.custom_theme = Theme.objects.get(pk=e.custom_theme.pk)
            except exceptions.ObjectDoesNotExist:
                pass

            nve = Version()
            nve.format = v.format
            nve.content_type = editoritem_ct
            nve.object_id = ei.pk
            nve.object_id_int = ei.pk
            nve.object_repr = repr(ei)
            nve.revision = v.revision
            nve.serialized_data = serializers.serialize(v.format,(ei,))
            nve.save()

            nvx = Version()
            nvx.format = 'json'
            nvx.content_type = newexam_ct
            nvx.object_id = v.object_id
            nvx.object_id_int = v.object_id
            nvx.object_repr = repr(ne)
            nvx.revision = v.revision
            nvx.serialized_data = serializers.serialize(v.format,(ne,))
            nvx.save()
        elif v.content_type==question_ct:
            data = v.serialized_data
            data = force_text(data.encode("utf8"))
            q = list(serializers.deserialize(v.format, data, ignorenonexistent=True))[0].object
            try:
                nq = NewQuestion.objects.get(pk=v.object_id)
            except NewQuestion.DoesNotExist:
                continue
            ei = nq.editoritem

            ei.name = q.name
            ei.author = User.objects.get(pk=q.author.pk)
            ei.content = q.content
            ei.created = q.created
            ei.content = q.content
            ei.share_uuid = q.share_uuid
            ei.last_modified = q.last_modified
            if q.licence:
                try:
                    ei.licence = Licence.objects.get(pk=q.licence.pk)
                except Licence.DoesNotExist:
                    pass
            ei.public_access = q.public_access
            ei.slug = q.slug
            ei.metadata = q.metadata
            try:
                if q.copy_of:
                    ei.copy_of = NewQuestion.objects.get(pk=q.copy_of.pk).editoritem
            except NewQuestion.DoesNotExist:
                pass

            nve = Version()
            nve.format = v.format
            nve.content_type = editoritem_ct
            nve.object_id = ei.pk
            nve.object_id_int = ei.pk
            nve.object_repr = repr(ei)
            nve.revision = v.revision
            nve.serialized_data = serializers.serialize(v.format,(ei,))
            nve.save()

            nvq = Version()
            nvq.format = 'json'
            nvq.content_type = newquestion_ct
            nvq.object_id = v.object_id
            nvq.object_id_int = v.object_id
            nvq.object_repr = repr(nq)
            nvq.revision = v.revision
            nvq.serialized_data = serializers.serialize(v.format,(nq,))
            nvq.save()

def delete_new_revisions(apps, schema_editor):
    Version = apps.get_model('reversion','Version')
    ContentType = apps.get_model('contenttypes','contenttype')

    exam_ct = ContentType.objects.get(app_label='editor',model='exam')
    question_ct = ContentType.objects.get(app_label='editor',model='question')
    newexam_ct = ContentType.objects.get(app_label='editor',model='newexam')
    newquestion_ct = ContentType.objects.get(app_label='editor',model='newquestion')
    editoritem_ct = ContentType.objects.get(app_label='editor',model='editoritem')

    Version.objects.filter(content_type__in=[newexam_ct,newquestion_ct,editoritem_ct]).delete()
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0021_old_exams_to_new'),
        ('reversion','__first__'),
        ('auth','__first__'),
        ('accounts','__first__'),
    ]

    operations = [
            migrations.RunPython(copy_revisions,delete_new_revisions)
    ]
