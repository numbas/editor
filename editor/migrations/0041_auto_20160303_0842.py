# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0040_auto_20160302_1219'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='abilityframework',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='abilitylevel',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='editoritem',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='subject',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='topic',
            options={'ordering': ('name',)},
        ),
    ]
