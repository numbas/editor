# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import datetime
from django.db import models, migrations

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0007_questionpullrequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='questionpullrequest',
            name='created',
            field=models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True),
            preserve_default=True,
        ),
    ]
