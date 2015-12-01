# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

def gen_uuid(apps, schema_editor):
    Exam = apps.get_model('editor','Exam')
    Exam._meta.get_field_by_name('last_modified')[0].auto_now = False
    for row in Exam.objects.all():
        row.share_uuid = uuid.uuid4()
        row.save()
    Question = apps.get_model('editor','Question')
    Question._meta.get_field_by_name('last_modified')[0].auto_now = False
    for row in Question.objects.all():
        row.share_uuid = uuid.uuid4()
        row.save()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0011_auto_20151201_1154'),
    ]

    operations = [
        migrations.AddField(
            model_name='exam',
            name='share_uuid',
            field=models.UUIDField(default=uuid.uuid4, null=True, editable=False),
        ),
        migrations.AddField(
            model_name='question',
            name='share_uuid',
            field=models.UUIDField(default=uuid.uuid4, null=True, editable=False),
        ),

        migrations.RunPython(gen_uuid, reverse_code = migrations.RunPython.noop),

        migrations.AlterField(
            model_name='exam',
            name='share_uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
        migrations.AlterField(
            model_name='question',
            name='share_uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
    ]
