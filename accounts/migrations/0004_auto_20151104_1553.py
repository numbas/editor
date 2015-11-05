# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0010_questionpullrequest_comment'),
        ('accounts', '0003_userprofile_question_basket'),
    ]

    operations = [
        migrations.CreateModel(
            name='BasketQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('qn_order', models.PositiveIntegerField()),
                ('profile', models.ForeignKey(to='accounts.UserProfile')),
                ('question', models.ForeignKey(to='editor.Question')),
            ],
            options={
                'ordering': ['qn_order'],
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='question_basket2',
            field=models.ManyToManyField(related_name='baskets', through='accounts.BasketQuestion', to='editor.Question', blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='question_basket',
            field=models.ManyToManyField(related_name='baskets_old', to='editor.Question', blank=True),
            preserve_default=True,
        ),
    ]
