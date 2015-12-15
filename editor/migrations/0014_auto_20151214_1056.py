# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0013_auto_20151214_1055'),
    ]

    operations = [
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='Topic',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
            ],
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_level_end',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_level_start',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_levels',
            field=models.ManyToManyField(to='editor.AbilityLevel'),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_level_end',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_level_start',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_levels',
            field=models.ManyToManyField(to='editor.AbilityLevel'),
        ),
        migrations.AddField(
            model_name='exam',
            name='subjects',
            field=models.ManyToManyField(to='editor.Subject'),
        ),
        migrations.AddField(
            model_name='exam',
            name='topics',
            field=models.ManyToManyField(to='editor.Topic'),
        ),
        migrations.AddField(
            model_name='question',
            name='subjects',
            field=models.ManyToManyField(to='editor.Subject'),
        ),
        migrations.AddField(
            model_name='question',
            name='topics',
            field=models.ManyToManyField(to='editor.Topic'),
        ),
    ]
