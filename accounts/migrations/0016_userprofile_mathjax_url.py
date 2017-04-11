# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0015_userprofile_wrap_lines'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='mathjax_url',
            field=models.CharField(default=b'', max_length=300, verbose_name=b'Preferred URL to load MathJax from', blank=True),
        ),
    ]
