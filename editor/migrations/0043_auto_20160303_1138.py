# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0042_remove_comment_date'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='abilitylevel',
            options={'ordering': ('framework', 'start')},
        ),
    ]
