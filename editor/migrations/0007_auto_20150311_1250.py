# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0006_change_stamp_status_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='exam',
            name='current_stamp',
            field=models.ForeignKey(to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='current_stamp',
            field=models.ForeignKey(to='editor.StampOfApproval', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='stampofapproval',
            name='status',
            field=models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'dontuse', b'Should not be used'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work")]),
            preserve_default=True,
        ),
    ]
