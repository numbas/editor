# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0018_site_broadcasts'),
    ]

    operations = [
        migrations.AlterField(
            model_name='editoritem',
            name='licence',
            field=models.ForeignKey(blank=True, to='editor.Licence', null=True),
        ),
    ]
