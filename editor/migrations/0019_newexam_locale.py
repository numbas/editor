# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0018_auto_20151215_0935'),
    ]

    operations = [
        migrations.AddField(
            model_name='newexam',
            name='locale',
            field=models.CharField(default=b'en-GB', max_length=200),
        ),
    ]
