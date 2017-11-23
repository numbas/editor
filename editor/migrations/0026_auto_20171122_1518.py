# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.jsonfield


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0025_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='customparttype',
            name='marking_notes',
            field=editor.jsonfield.JSONField(default='[]', verbose_name='Marking algorithm notes', blank=True),
        ),
        migrations.AlterField(
            model_name='customparttype',
            name='description',
            field=models.TextField(default='', verbose_name="What's this part type for?", blank=True),
        ),
    ]
