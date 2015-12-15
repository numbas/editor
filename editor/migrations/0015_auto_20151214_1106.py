# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import editor.jsonfield
import django.db.models.deletion
from django.conf import settings
import taggit.managers
import editor.models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0014_auto_20151214_1056'),
    ]

    operations = [
        migrations.CreateModel(
            name='Access',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Public can view'), (b'edit', b'Public can edit')])),
            ],
        ),
        migrations.CreateModel(
            name='EditorItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(default=b'Untitled Question', max_length=200)),
                ('slug', models.SlugField(max_length=200, editable=False)),
                ('filename', models.CharField(default=b'', max_length=200, editable=False)),
                ('public_access', models.CharField(default=b'view', max_length=6, choices=[(b'hidden', b'Hidden'), (b'view', b'Public can view'), (b'edit', b'Public can edit')])),
                ('content', models.TextField(blank=True, validators=[editor.models.validate_content])),
                ('metadata', editor.jsonfield.JSONField(blank=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('last_modified', models.DateTimeField(auto_now=True)),
                ('share_uuid', models.UUIDField(default=uuid.uuid4, unique=True, editable=False)),
                ('published', models.BooleanField(default=False)),
                ('published_date', models.DateTimeField(null=True)),
                ('ability_level_start', editor.models.AbilityLevelField(null=True)),
                ('ability_level_end', editor.models.AbilityLevelField(null=True)),
                ('ability_levels', models.ManyToManyField(to='editor.AbilityLevel')),
                ('access_rights', models.ManyToManyField(related_name='_editoritem_access_rights_+', editable=False, to=settings.AUTH_USER_MODEL, through='editor.Access', blank=True)),
                ('author', models.ForeignKey(related_name='own_items', to=settings.AUTH_USER_MODEL)),
                ('copy_of', models.ForeignKey(related_name='copies', on_delete=django.db.models.deletion.SET_NULL, to='editor.EditorItem', null=True)),
                ('current_stamp', models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.StampOfApproval', null=True)),
                ('licence', models.ForeignKey(to='editor.Licence', null=True)),
                ('subjects', models.ManyToManyField(to='editor.Subject')),
            ],
        ),
        migrations.CreateModel(
            name='TaggedItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('object_id', models.IntegerField(verbose_name='Object id', db_index=True)),
                ('content_type', models.ForeignKey(related_name='editor_taggeditem_tagged_items', verbose_name='Content type', to='contenttypes.ContentType')),
                ('tag', models.ForeignKey(related_name='tagged_editoritems', to='editor.EditorTag')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='editoritem',
            name='tags',
            field=taggit.managers.TaggableManager(to='editor.EditorTag', through='editor.TaggedItem', help_text='A comma-separated list of tags.', verbose_name='Tags'),
        ),
        migrations.AddField(
            model_name='editoritem',
            name='topics',
            field=models.ManyToManyField(to='editor.Topic'),
        ),
        migrations.AddField(
            model_name='editoritem',
            name='watching_users',
            field=models.ManyToManyField(related_name='watched_items', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='access',
            name='item',
            field=models.ForeignKey(to='editor.EditorItem'),
        ),
        migrations.AddField(
            model_name='access',
            name='user',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL),
        ),
    ]
