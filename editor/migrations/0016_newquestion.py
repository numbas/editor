# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0015_auto_20151214_1106'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('editoritem', models.ForeignKey(related_name='question', to='editor.EditorItem')),
                ('extensions', models.ManyToManyField(to='editor.Extension', blank=True)),
                ('resources', models.ManyToManyField(to='editor.Image', blank=True)),
            ],
            options={
                'ordering': ['editoritem__name'],
                'permissions': (('highlight', 'Can pick questions to feature on the front page.'),),
            },
        ),
    ]
