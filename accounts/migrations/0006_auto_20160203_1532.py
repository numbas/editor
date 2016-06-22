# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_auto_20160203_1531'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='basketquestion',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='basketquestion',
            name='profile',
        ),
        migrations.RemoveField(
            model_name='basketquestion',
            name='question',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='favourite_exams',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='favourite_questions',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='question_basket',
        ),
        migrations.DeleteModel(
            name='BasketQuestion',
        ),
    ]
