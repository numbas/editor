# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0005_stamp_of_approval'),
    ]

    operations = [
        migrations.AlterField(
            model_name='stampofapproval',
            name='status',
            field=models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'dontuse', b'Should not be used'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work"), (b'pleasetest', b'Needs to be tested')]),
            preserve_default=True,
        ),
    ]
