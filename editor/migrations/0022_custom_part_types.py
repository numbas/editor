# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.jsonfield
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0021_auto_20170112_1526'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomPartType',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200, verbose_name='Name')),
                ('short_name', models.CharField(max_length=200, unique=True, verbose_name='Unique identifier for this part type')),
                ('description', models.TextField(default='', verbose_name="What's this part type for?")),
                ('input_widget', models.CharField(max_length=200, choices=[('string', 'String'), ('number', 'Number'), ('jme', 'Mathematical expression'), ('matrix', 'Matrix'), ('radios', 'Radio buttons'), ('checkboxes', 'Choose several from a list'), ('dropdown', 'Drop-down box')], verbose_name='Answer input method')),
                ('can_be_gap', models.BooleanField(default=True, verbose_name='Can this part be a gap?')),
                ('can_be_step', models.BooleanField(default=True, verbose_name='Can this part be a step?')),
                ('marking_script', models.TextField(blank=True, default='', verbose_name='Marking algorithm')),
                ('settings', editor.jsonfield.JSONField(blank=True)),
                ('public_availability', models.CharField(default='restricted', max_length=10, choices=[('restricted', 'Only to permitted users'), ('always', 'Always available'), ('select', 'When selected')], verbose_name='Public availability')),
                ('author', models.ForeignKey(related_name='own_custom_part_types', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='newquestion',
            name='custom_part_types',
            field=models.ManyToManyField(blank=True, related_name='questions', to='editor.CustomPartType'),
        ),
        migrations.AddField(
            model_name='project',
            name='custom_part_types',
            field=models.ManyToManyField(related_name='projects', to='editor.CustomPartType'),
        ),
    ]
