# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0014_auto_20170112_1526'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='wrap_lines',
            field=models.BooleanField(default=False, verbose_name='Wrap long lines in the code editor?'),
        ),
    ]
