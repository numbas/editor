# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0030_auto_20160208_0931'),
    ]

    operations = [
        migrations.AlterField(
            model_name='projectaccess',
            name='user',
            field=models.ForeignKey(related_name='project_memberships', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='projectaccess',
            unique_together=set([('project', 'user')]),
        ),
    ]
