# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0016_timelineitem_hidden_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='public_view',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='project',
            name='watching_non_members',
            field=models.ManyToManyField(related_name='watched_projects', to=settings.AUTH_USER_MODEL),
        ),
    ]
