# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0008_questionpullrequest_created'),
    ]

    operations = [
        migrations.AlterField(
            model_name='questionpullrequest',
            name='open',
            field=models.BooleanField(default=True),
            preserve_default=True,
        ),
    ]
