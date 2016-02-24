# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0036_auto_20160222_1441'),
    ]

    operations = [
        migrations.AddField(
            model_name='topic',
            name='subjects',
            field=models.ManyToManyField(to='editor.Subject'),
        ),
    ]
