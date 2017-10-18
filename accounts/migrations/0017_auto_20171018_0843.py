# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0016_userprofile_mathjax_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='personal_project',
            field=models.ForeignKey(to='editor.Project', related_name='personal_project_of', on_delete=django.db.models.deletion.SET_NULL, null=True),
        ),
    ]
