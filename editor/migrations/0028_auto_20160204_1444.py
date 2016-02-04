# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0027_auto_20160203_1629'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='highlight',
            name='item',
        ),
        migrations.RemoveField(
            model_name='highlight',
            name='picked_by',
        ),
        migrations.DeleteModel(
            name='Highlight',
        ),
    ]
