# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0044_restorepoint'),
    ]

    operations = [
        migrations.CreateModel(
            name='ItemChangedTimelineItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('verb', models.CharField(max_length=10, editable=False, choices=[(b'created', b'created'), (b'deleted', b'deleted')])),
                ('object', models.ForeignKey(to='editor.EditorItem')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
    ]
