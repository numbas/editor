# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_auto_20160203_1535'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userprofile',
            old_name='new_favourite_exams',
            new_name='favourite_exams',
        ),
        migrations.RenameField(
            model_name='userprofile',
            old_name='new_favourite_questions',
            new_name='favourite_questions',
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='favourite_exams',
            field=models.ManyToManyField(related_name='fans', to='editor.NewExam', blank=True),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='favourite_questions',
            field=models.ManyToManyField(related_name='fans', to='editor.NewQuestion', blank=True),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='question_basket',
            field=models.ManyToManyField(related_name='baskets', through='accounts.BasketQuestion', to='editor.NewQuestion', blank=True),
        ),
    ]
