# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
import django_thumbs.db.models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0012_auto_20160229_0917'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='avatar',
            field=django_thumbs.db.models.ImageWithThumbsField(max_length=255, null=True, upload_to=b'avatars', blank=True),
        ),
    ]
