# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0026_remove_editoritem_filename'),
    ]

    operations = [
        migrations.AlterField(
            model_name='editoritem',
            name='name',
            field=models.CharField(default=b'Untitled', max_length=200),
        ),
    ]
