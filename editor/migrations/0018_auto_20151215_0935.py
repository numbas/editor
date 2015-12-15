# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0017_auto_20151214_1117'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewComment',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('text', models.TextField()),
                ('date', models.DateTimeField(auto_now_add=True)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.CreateModel(
            name='NewStampOfApproval',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('status', models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'dontuse', b'Should not be used'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work"), (b'pleasetest', b'Needs to be tested')])),
                ('date', models.DateTimeField(auto_now_add=True)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.AlterField(
            model_name='editoritem',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.NewStampOfApproval', null=True),
        ),
        migrations.AlterField(
            model_name='newexam',
            name='editoritem',
            field=models.OneToOneField(to='editor.EditorItem'),
        ),
        migrations.AlterField(
            model_name='newquestion',
            name='editoritem',
            field=models.OneToOneField(to='editor.EditorItem'),
        ),
        migrations.AddField(
            model_name='newstampofapproval',
            name='object',
            field=models.ForeignKey(related_name='stamps', to='editor.EditorItem'),
        ),
        migrations.AddField(
            model_name='newstampofapproval',
            name='user',
            field=models.ForeignKey(related_name='newstamps', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='newcomment',
            name='object',
            field=models.ForeignKey(related_name='comments', to='editor.EditorItem'),
        ),
        migrations.AddField(
            model_name='newcomment',
            name='user',
            field=models.ForeignKey(related_name='newcomments', to=settings.AUTH_USER_MODEL),
        ),
    ]
