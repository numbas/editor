# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0003_load_initial_licences'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='question',
            name='progress',
        ),
    ]
