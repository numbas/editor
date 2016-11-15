# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0019_auto_20160601_1528'),
    ]

    operations = [
        migrations.AddField(
            model_name='newexamquestion',
            name='group',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
