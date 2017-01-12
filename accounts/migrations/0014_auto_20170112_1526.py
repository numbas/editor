# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django_thumbs.db.models
import sanitizer.models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0013_userprofile_avatar'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='avatar',
            field=django_thumbs.db.models.ImageWithThumbsField(blank=True, upload_to='avatars', max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='bio',
            field=sanitizer.models.SanitizedTextField(default=''),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='language',
            field=models.CharField(default='en-GB', max_length=100),
        ),
    ]
