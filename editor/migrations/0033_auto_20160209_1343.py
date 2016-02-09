# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0032_project_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='default_licence',
            field=models.ForeignKey(to='editor.Licence', null=True),
        ),
        migrations.AddField(
            model_name='project',
            name='default_locale',
            field=models.CharField(default=b'en-GB', max_length=10, choices=[(b'en-GB', b'English'), (b'nb-NO', 'Bokm\xe5l'), (b'nl-NL', b'Nederlands'), (b'es-ES', 'Espa\xf1ol')]),
        ),
    ]
