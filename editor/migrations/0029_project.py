# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0028_auto_20160204_1444'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('owner', models.ForeignKey(related_name='own_projects', to=settings.AUTH_USER_MODEL)),
            ],
            bases=(models.Model, editor.models.ControlledObject),
        ),
        migrations.CreateModel(
            name='ProjectAccess',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')])),
                ('project', models.ForeignKey(to='editor.Project')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterField(
            model_name='access',
            name='access',
            field=models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')]),
        ),
        migrations.AlterField(
            model_name='examaccess',
            name='access',
            field=models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')]),
        ),
        migrations.AlterField(
            model_name='questionaccess',
            name='access',
            field=models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')]),
        ),
        migrations.AddField(
            model_name='project',
            name='permissions',
            field=models.ManyToManyField(to=settings.AUTH_USER_MODEL, through='editor.ProjectAccess'),
        ),
        migrations.AddField(
            model_name='editoritem',
            name='project',
            field=models.ForeignKey(to='editor.Project', null=True),
        ),
 ]
