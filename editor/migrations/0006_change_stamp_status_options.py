# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0005_stampofapproval'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stampofapproval',
            name='status',
            field=models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work")]),
            preserve_default=True,
        ),
    ]
