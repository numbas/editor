# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0015_remove_comment_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='timelineitem',
            name='hidden_by',
            field=models.ManyToManyField(related_name='hidden_timelineitems', to=settings.AUTH_USER_MODEL, blank=True),
        ),
    ]
