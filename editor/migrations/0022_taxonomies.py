# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.jsonfield


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0021_auto_20170112_1526'),
    ]

    operations = [
        migrations.CreateModel(
            name='Taxonomy',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', auto_created=True, serialize=False)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
                ('json', editor.jsonfield.JSONField(blank=True)),
            ],
            options={
                'verbose_name_plural': 'taxonomies',
            },
        ),
        migrations.CreateModel(
            name='TaxonomyNode',
            fields=[
                ('id', models.AutoField(primary_key=True, verbose_name='ID', auto_created=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=200)),
                ('parent', models.ForeignKey(related_name='children', to='editor.TaxonomyNode', null=True, blank=True)),
                ('taxonomy', models.ForeignKey(related_name='nodes', to='editor.Taxonomy')),
            ],
        ),
        migrations.AddField(
            model_name='editoritem',
            name='taxonomy_nodes',
            field=models.ManyToManyField(to='editor.TaxonomyNode'),
        ),
    ]
