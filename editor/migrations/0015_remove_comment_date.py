# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0014_version_2_data_migration'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='comment',
            name='date',
        ),
    ]
