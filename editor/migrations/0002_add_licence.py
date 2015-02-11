# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Licence',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=80)),
                ('short_name', models.CharField(unique=True, max_length=20)),
                ('can_reuse', models.BooleanField(default=True)),
                ('can_modify', models.BooleanField(default=True)),
                ('can_sell', models.BooleanField(default=True)),
                ('url', models.URLField(blank=True)),
                ('full_text', models.TextField(blank=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='exam',
            name='licence',
            field=models.ForeignKey(to='editor.Licence', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='licence',
            field=models.ForeignKey(to='editor.Licence', null=True),
            preserve_default=True,
        ),
    ]
