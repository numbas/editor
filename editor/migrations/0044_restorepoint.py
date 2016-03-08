# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        ('reversion', '0002_auto_20141216_1509'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0043_auto_20160303_1138'),
    ]

    operations = [
        migrations.CreateModel(
            name='RestorePoint',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('description', models.TextField()),
                ('object', models.ForeignKey(related_name='restore_points', to='editor.EditorItem')),
                ('revision', models.ForeignKey(to='reversion.Revision')),
                ('user', models.ForeignKey(related_name='restore_points', to=settings.AUTH_USER_MODEL)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
    ]
