# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0001_initial'),
        ('editor', '0004_remove_question_progress'),
    ]

    operations = [
        migrations.CreateModel(
            name='StampOfApproval',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.PositiveIntegerField()),
                ('status', models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'problem', b'Not ready to use')])),
                ('date', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('object_content_type', models.ForeignKey(to='contenttypes.ContentType')),
                ('user', models.ForeignKey(related_name='stamps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
