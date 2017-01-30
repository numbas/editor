# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations

def copy_basket(apps, schema_editor):
    UserProfile = apps.get_model('accounts', 'UserProfile')
    BasketQuestion = apps.get_model('accounts', 'BasketQuestion')
    db_alias = schema_editor.connection.alias
    for profile in UserProfile.objects.using(db_alias).all():
        BasketQuestion.objects.using(db_alias).bulk_create([
            BasketQuestion(profile=profile, question=question, qn_order=i) for i, question in enumerate(profile.question_basket.using(db_alias).all())
        ])

def noop(apps, schema_editor):
    pass

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
                'unique_together': set([('profile', 'question')]),
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
        migrations.RunPython(copy_basket, noop),
        migrations.RemoveField(
            model_name='userprofile',
            name='question_basket',
        ),
        migrations.RenameField(
            model_name='userprofile',
            old_name='question_basket2',
            new_name='question_basket',
        ),
    ]
