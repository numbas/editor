# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0039_auto_20160301_1344'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='newcomment',
            name='object',
        ),
        migrations.RemoveField(
            model_name='newcomment',
            name='user',
        ),
        migrations.AlterModelOptions(
            name='timelineitem',
            options={'ordering': ('-date',)},
        ),
        migrations.DeleteModel(
            name='NewComment',
        ),
    ]
