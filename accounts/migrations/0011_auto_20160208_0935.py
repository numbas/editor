# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_create_personal_projects'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='personal_project',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, to='editor.Project', null=True),
        ),
    ]
