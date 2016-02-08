# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

def set_project(apps,schema_editor):
    EditorItem = apps.get_model('editor','EditorItem')

    EditorItem._meta.get_field_by_name('last_modified')[0].auto_now = False

    for e in EditorItem.objects.all():
        e.project = e.author.userprofile.personal_project
        e.save()

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0029_project'),
    ]

    operations = [
        migrations.RunPython(set_project,migrations.RunPython.noop)
    ]
