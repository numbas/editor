# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0006_comment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exam',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='question',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
    ]
