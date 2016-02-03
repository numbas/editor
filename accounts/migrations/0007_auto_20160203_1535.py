# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0026_remove_editoritem_filename'),
        ('accounts', '0006_auto_20160203_1532'),
    ]

    operations = [
        migrations.CreateModel(
            name='BasketQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('qn_order', models.PositiveIntegerField()),
            ],
            options={
                'ordering': ['qn_order'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='newbasketquestion',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='newbasketquestion',
            name='profile',
        ),
        migrations.RemoveField(
            model_name='newbasketquestion',
            name='question',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='new_question_basket',
        ),
        migrations.DeleteModel(
            name='NewBasketQuestion',
        ),
        migrations.AddField(
            model_name='basketquestion',
            name='profile',
            field=models.ForeignKey(to='accounts.UserProfile'),
        ),
        migrations.AddField(
            model_name='basketquestion',
            name='question',
            field=models.ForeignKey(to='editor.NewQuestion'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='question_basket',
            field=models.ManyToManyField(related_name='new_baskets', through='accounts.BasketQuestion', to='editor.NewQuestion', blank=True),
        ),
        migrations.AlterUniqueTogether(
            name='basketquestion',
            unique_together=set([('profile', 'question')]),
        ),
    ]
