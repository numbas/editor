# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('editor', '0038_auto_20160229_0917'),
    ]

    operations = [
        migrations.CreateModel(
            name='TimelineItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('timeline_id', models.PositiveIntegerField()),
                ('object_id', models.PositiveIntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('object_content_type', models.ForeignKey(related_name='timelineitem_object', to='contenttypes.ContentType')),
                ('timeline_content_type', models.ForeignKey(related_name='timelineitem_timeline', to='contenttypes.ContentType')),
            ],
        ),
        migrations.RemoveField(
            model_name='newcomment',
            name='date',
        ),
        migrations.RemoveField(
            model_name='newstampofapproval',
            name='date',
        ),
        migrations.AlterUniqueTogether(
            name='timelineitem',
            unique_together=set([('object_id', 'object_content_type')]),
        ),
    ]
