# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0035_auto_20160222_1441'),
    ]

    operations = [
        migrations.AlterField(
            model_name='editoritem',
            name='name',
            field=models.CharField(max_length=200),
        ),
        migrations.AlterField(
            model_name='editoritem',
            name='project',
            field=models.ForeignKey(related_name='items', to='editor.Project', null=True),
        ),
    ]
