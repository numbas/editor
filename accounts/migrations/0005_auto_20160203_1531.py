# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0013_version_2_models'),
        ('accounts', '0004_auto_20151104_1553'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewBasketQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('qn_order', models.PositiveIntegerField()),
            ],
            options={
                'ordering': ['qn_order'],
            },
        ),
        migrations.AddField(
            model_name='userprofile',
            name='new_favourite_exams',
            field=models.ManyToManyField(related_name='new_fans', to='editor.NewExam', blank=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='new_favourite_questions',
            field=models.ManyToManyField(related_name='new_fans', to='editor.NewQuestion', blank=True),
        ),
        migrations.AddField(
            model_name='newbasketquestion',
            name='profile',
            field=models.ForeignKey(to='accounts.UserProfile', on_delete=models.CASCADE),
        ),
        migrations.AddField(
            model_name='newbasketquestion',
            name='question',
            field=models.ForeignKey(to='editor.NewQuestion', on_delete=models.CASCADE),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='new_question_basket',
            field=models.ManyToManyField(related_name='new_baskets', through='accounts.NewBasketQuestion', to='editor.NewQuestion', blank=True),
        ),
        migrations.AlterUniqueTogether(
            name='newbasketquestion',
            unique_together=set([('profile', 'question')]),
        ),
    ]
