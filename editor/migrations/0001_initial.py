# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import datetime
from django.conf import settings
import django.db.models.deletion
import editor.jsonfield
import taggit.managers
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EditorTag',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=100, verbose_name='Name')),
                ('slug', models.SlugField(unique=True, max_length=100, verbose_name='Slug')),
                ('official', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['name'],
                'verbose_name': 'tag',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Exam',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'Untitled Exam', max_length=200)),
                ('theme', models.CharField(default=b'default', max_length=200, blank=True)),
                ('locale', models.CharField(default=b'en-GB', max_length=200)),
                ('slug', models.SlugField(max_length=200, editable=False)),
                ('filename', models.CharField(default=b'', max_length=200, editable=False)),
                ('content', models.TextField(blank=True, validators=[editor.models.validate_content])),
                ('created', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('last_modified', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now=True)),
                ('metadata', editor.jsonfield.JSONField(blank=True)),
                ('public_access', models.CharField(default=b'view', max_length=6, choices=[(b'hidden', b'Hidden'), (b'view', b'Public can view'), (b'edit', b'Public can edit')])),
            ],
            options={
                'ordering': ['name'],
                'permissions': (('highlight', 'Can pick exams to feature on the front page.'),),
            },
            bases=(models.Model, editor.models.NumbasObject, editor.models.ControlledObject),
        ),
        migrations.CreateModel(
            name='ExamAccess',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Public can view'), (b'edit', b'Public can edit')])),
                ('exam', models.ForeignKey(to='editor.Exam')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='ExamHighlight',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('note', models.TextField(blank=True)),
                ('date', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('exam', models.ForeignKey(to='editor.Exam')),
                ('picked_by', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='ExamQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('qn_order', models.PositiveIntegerField()),
                ('exam', models.ForeignKey(to='editor.Exam')),
            ],
            options={
                'ordering': ['qn_order'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Extension',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(help_text=b'A human-readable name for the extension', max_length=200)),
                ('location', models.CharField(default=b'', max_length=200, blank=True, help_text=b'A unique identifier for this extension', unique=True, verbose_name=b'Short name')),
                ('url', models.CharField(help_text=b'Address of a page about the extension', max_length=300, verbose_name=b'Documentation URL', blank=True)),
                ('public', models.BooleanField(default=False, help_text=b'Can this extension be seen by everyone?')),
                ('slug', models.SlugField(default=b'an-extension', max_length=200, editable=False)),
                ('last_modified', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now=True)),
                ('zipfile', models.FileField(upload_to=b'user-extensions/zips', max_length=255, blank=True, help_text=b"A .zip package containing the extension's files", null=True, verbose_name=b'Extension package')),
                ('author', models.ForeignKey(related_name='own_extensions', blank=True, to=settings.AUTH_USER_MODEL, null=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(max_length=255)),
                ('image', models.ImageField(max_length=255, upload_to=b'question-resources/')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Question',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'Untitled Question', max_length=200)),
                ('slug', models.SlugField(max_length=200, editable=False)),
                ('filename', models.CharField(default=b'', max_length=200, editable=False)),
                ('content', models.TextField(blank=True, validators=[editor.models.validate_content])),
                ('metadata', editor.jsonfield.JSONField(blank=True)),
                ('created', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('last_modified', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now=True)),
                ('public_access', models.CharField(default=b'view', max_length=6, choices=[(b'hidden', b'Hidden'), (b'view', b'Public can view'), (b'edit', b'Public can edit')])),
                ('progress', models.CharField(default=b'in-progress', max_length=15, choices=[(b'in-progress', b'Writing in progress'), (b'not-for-use', b'Not for general use'), (b'testing', b'Undergoing testing'), (b'ready', b'Tested and ready to use')])),
            ],
            options={
                'ordering': ['name'],
                'permissions': (('highlight', 'Can pick questions to feature on the front page.'),),
            },
            bases=(models.Model, editor.models.NumbasObject, editor.models.ControlledObject),
        ),
        migrations.CreateModel(
            name='QuestionAccess',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Public can view'), (b'edit', b'Public can edit')])),
                ('question', models.ForeignKey(to='editor.Question')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='QuestionHighlight',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('note', models.TextField(blank=True)),
                ('date', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now_add=True)),
                ('picked_by', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
                ('question', models.ForeignKey(to='editor.Question')),
            ],
            options={
                'ordering': ['-date'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='TaggedQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.IntegerField(verbose_name='Object id', db_index=True)),
                ('content_type', models.ForeignKey(related_name='editor_taggedquestion_tagged_items', verbose_name='Content type', to='contenttypes.ContentType')),
                ('tag', models.ForeignKey(related_name='tagged_items', to='editor.EditorTag')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Theme',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('public', models.BooleanField(default=False, help_text=b'Can this theme be seen by everyone?')),
                ('slug', models.SlugField(max_length=200, editable=False)),
                ('last_modified', models.DateTimeField(default=datetime.datetime(1970, 1, 1, 0, 0), auto_now=True)),
                ('zipfile', models.FileField(help_text=b"A .zip package containing the theme's files", upload_to=b'user-themes/zips', max_length=255, verbose_name=b'Theme package')),
                ('author', models.ForeignKey(related_name='own_themes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='question',
            name='access_rights',
            field=models.ManyToManyField(related_name='accessed_questions+', editable=False, to=settings.AUTH_USER_MODEL, through='editor.QuestionAccess', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='author',
            field=models.ForeignKey(related_name='own_questions', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='copy_of',
            field=models.ForeignKey(related_name='copies', on_delete=django.db.models.deletion.SET_NULL, to='editor.Question', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='extensions',
            field=models.ManyToManyField(to='editor.Extension', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='resources',
            field=models.ManyToManyField(to='editor.Image', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='question',
            name='tags',
            field=taggit.managers.TaggableManager(to='editor.EditorTag', through='editor.TaggedQuestion', help_text='A comma-separated list of tags.', verbose_name='Tags'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='examquestion',
            name='question',
            field=models.ForeignKey(to='editor.Question'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='exam',
            name='access_rights',
            field=models.ManyToManyField(related_name='accessed_exams+', editable=False, to=settings.AUTH_USER_MODEL, through='editor.ExamAccess', blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='exam',
            name='author',
            field=models.ForeignKey(related_name='own_exams', to=settings.AUTH_USER_MODEL),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='exam',
            name='custom_theme',
            field=models.ForeignKey(related_name='used_in_exams', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.Theme', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='exam',
            name='questions',
            field=models.ManyToManyField(to='editor.Question', editable=False, through='editor.ExamQuestion', blank=True),
            preserve_default=True,
        ),
    ]
