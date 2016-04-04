# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0049_pullrequest'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pullrequest',
            name='closed_by',
            field=models.ForeignKey(related_name='pullrequests_closed', on_delete=django.db.models.deletion.SET_NULL, blank=True, to=settings.AUTH_USER_MODEL, null=True),
        ),
    ]
