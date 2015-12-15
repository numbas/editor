# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0012_auto_20151201_1335'),
    ]

    operations = [
        migrations.CreateModel(
            name='AbilityFramework',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='AbilityLevel',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
                ('start', models.DecimalField(max_digits=11, decimal_places=10)),
                ('end', models.DecimalField(max_digits=11, decimal_places=10)),
                ('framework', models.ForeignKey(related_name='levels', to='editor.AbilityFramework')),
            ],
        ),
        migrations.AddField(
            model_name='exam',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='exam',
            name='published_date',
            field=models.DateTimeField(null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='published',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='question',
            name='published_date',
            field=models.DateTimeField(null=True),
        ),
    ]
