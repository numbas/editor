# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0005_stamp_of_approval'),
        ('accounts', '0002_auto_20150209_1118'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='question_basket',
            field=models.ManyToManyField(related_name='baskets', to='editor.Question', blank=True),
            preserve_default=True,
        ),
    ]
