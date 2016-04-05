# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0050_auto_20160404_1520'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProjectInvitation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('email', models.EmailField(max_length=254)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')])),
                ('invited_by', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(related_name='invitations', to='editor.Project')),
            ],
        ),
    ]
