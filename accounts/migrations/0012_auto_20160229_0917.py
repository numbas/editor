# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_auto_20160208_0935'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='favourite_exams',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='favourite_questions',
        ),
    ]
