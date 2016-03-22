# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0047_auto_20160308_1311'),
    ]

    operations = [
        migrations.AddField(
            model_name='timelineitem',
            name='user',
            field=models.ForeignKey(related_name='timelineitems', to=settings.AUTH_USER_MODEL, null=True),
        ),
        migrations.AlterField(
            model_name='resource',
            name='file',
            field=models.FileField(max_length=255, upload_to=b'question-resources/'),
        ),
    ]
