# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0037_topic_subjects'),
    ]

    operations = [
        migrations.AlterField(
            model_name='newexam',
            name='questions',
            field=models.ManyToManyField(related_name='exams', editable=False, to='editor.NewQuestion', through='editor.NewExamQuestion', blank=True),
        ),
    ]
