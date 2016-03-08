# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0045_itemchangedtimelineitem'),
    ]

    operations = [
        migrations.AlterField(
            model_name='itemchangedtimelineitem',
            name='verb',
            field=models.CharField(max_length=10, editable=False, choices=[(b'created', b'created')]),
        ),
    ]
