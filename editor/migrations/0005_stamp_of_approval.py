# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
import editor.models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0001_initial'),
        ('editor', '0004_remove_question_progress'),
    ]

    operations = [
        migrations.CreateModel(
            name='Comment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.PositiveIntegerField()),
                ('text', models.TextField()),
                ('date', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('object_content_type', models.ForeignKey(to='contenttypes.ContentType')),
                ('user', models.ForeignKey(related_name='comments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.CreateModel(
            name='StampOfApproval',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.PositiveIntegerField()),
                ('status', models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'dontuse', b'Should not be used'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work")])),
                ('date', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('object_content_type', models.ForeignKey(to='contenttypes.ContentType')),
                ('user', models.ForeignKey(related_name='stamps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.AddField(
            model_name='exam',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
    ]
