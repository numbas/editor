# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.jsonfield


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0023_merge'),
    ]

    operations = [
        migrations.AddField(
            model_name='customparttype',
            name='input_options',
            field=editor.jsonfield.JSONField(verbose_name='Options for the answer input method', blank=True),
        ),
    ]
