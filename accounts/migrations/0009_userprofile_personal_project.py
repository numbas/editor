# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0029_project'),
        ('accounts', '0008_auto_20160203_1535'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='personal_project',
            field=models.ForeignKey(to='editor.Project', null=True),
        ),
    ]
