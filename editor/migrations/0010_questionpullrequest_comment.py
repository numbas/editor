# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0009_auto_20151014_1104'),
    ]

    operations = [
        migrations.AddField(
            model_name='questionpullrequest',
            name='comment',
            field=models.TextField(blank=True),
            preserve_default=True,
        ),
    ]
