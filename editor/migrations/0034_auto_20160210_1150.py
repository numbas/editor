# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0033_auto_20160209_1343'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='default_licence',
            field=models.ForeignKey(blank=True, to='editor.Licence', null=True),
        ),
    ]
