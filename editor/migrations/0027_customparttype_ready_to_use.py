# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0026_auto_20171122_1518'),
    ]

    operations = [
        migrations.AddField(
            model_name='customparttype',
            name='ready_to_use',
            field=models.BooleanField(default=False, verbose_name='Ready to use?'),
        ),
    ]
