# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0001_initial'),
        ('editor', '0005_stampofapproval'),
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
            bases=(models.Model,),
        ),
    ]
