# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0025_auto_20151216_1336'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='editoritem',
            name='filename',
        ),
    ]
