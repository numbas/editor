# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0017_project_public_view'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteBroadcast',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(max_length=200)),
                ('text', models.TextField()),
                ('sticky', models.BooleanField(default=False)),
                ('show_until', models.DateTimeField(null=True, blank=True)),
                ('author', models.ForeignKey(related_name='site_broadcasts', to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.AlterField(
            model_name='timelineitem',
            name='timeline_content_type',
            field=models.ForeignKey(related_name='timelineitem_timeline', to='contenttypes.ContentType', null=True, on_delete=models.CASCADE),
        ),
        migrations.AlterField(
            model_name='timelineitem',
            name='timeline_id',
            field=models.PositiveIntegerField(null=True),
        ),
    ]
