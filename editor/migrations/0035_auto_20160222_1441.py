# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import uuid

def gen_uuid(apps, schema_editor):
    EditorItem = apps.get_model('editor','EditorItem')
    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False
    for row in EditorItem.objects.all():
        row.share_uuid_edit = uuid.uuid4()
        row.save()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0034_auto_20160210_1150'),
    ]

    operations = [
        migrations.RenameField(
            model_name='editoritem',
            old_name='share_uuid',
            new_name='share_uuid_view',
        ),
        migrations.AddField(
            model_name='editoritem',
            name='share_uuid_edit',
            field=models.UUIDField(default=uuid.uuid4, null=True, editable=False),
        ),

        migrations.RunPython(gen_uuid, reverse_code = migrations.RunPython.noop),

        migrations.AlterField(
            model_name='editoritem',
            name='share_uuid_edit',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False),
        ),
    ]
