# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

from django.core.management import call_command

fixture = 'initial_data'

def load_fixture(apps, schema_editor):
    call_command('loaddata', fixture, app_label='editor') 

def unload_fixture(apps, schema_editor):
    Licence = apps.get_model("editor", "Licence")
    Licence.objects.all().delete()

class Migration(migrations.Migration):  

    dependencies = [
        ('editor', '0002_add_licence'),
    ]

    operations = [
        migrations.RunPython(load_fixture, reverse_code=unload_fixture),
    ]
