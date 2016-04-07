# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django
from django.db import migrations, models
from django.conf import settings
import editor.models
import uuid
import taggit.managers

class Migration(migrations.Migration):

    dependencies = [
        ('reversion', '0002_auto_20141216_1509'),
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0012_auto_20151201_1335'),
    ]

    operations = [
        # add ability levels and published field
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

        # add subjects and topics
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
            ],
        ),
        migrations.CreateModel(
            name='Topic',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=200)),
                ('description', models.TextField()),
                ('subjects', models.ManyToManyField(to='editor.Subject')),
            ],
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_level_end',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_level_start',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='exam',
            name='ability_levels',
            field=models.ManyToManyField(to='editor.AbilityLevel'),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_level_end',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_level_start',
            field=editor.models.AbilityLevelField(null=True),
        ),
        migrations.AddField(
            model_name='question',
            name='ability_levels',
            field=models.ManyToManyField(to='editor.AbilityLevel'),
        ),
        migrations.AddField(
            model_name='exam',
            name='subjects',
            field=models.ManyToManyField(to='editor.Subject'),
        ),
        migrations.AddField(
            model_name='exam',
            name='topics',
            field=models.ManyToManyField(to='editor.Topic'),
        ),
        migrations.AddField(
            model_name='question',
            name='subjects',
            field=models.ManyToManyField(to='editor.Subject'),
        ),
        migrations.AddField(
            model_name='question',
            name='topics',
            field=models.ManyToManyField(to='editor.Topic'),
        ),

        # add EditorItem model
        migrations.CreateModel(
            name='Access',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')])),
            ],
        ),
        migrations.CreateModel(
            name='EditorItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(max_length=200, editable=False)),
                ('public_access', models.CharField(default=b'view', max_length=6, choices=[(b'hidden', b'Hidden'), (b'view', b'Public can view'), (b'edit', b'Public can edit')])),
                ('content', models.TextField(blank=True, validators=[editor.models.validate_content])),
                ('metadata', editor.jsonfield.JSONField(blank=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('last_modified', models.DateTimeField(auto_now=True)),
                ('share_uuid_view', models.UUIDField(default=uuid.uuid4, unique=True, editable=False)),
                ('share_uuid_edit', models.UUIDField(default=uuid.uuid4, unique=True, editable=False)),
                ('published', models.BooleanField(default=False)),
                ('published_date', models.DateTimeField(null=True)),
                ('ability_level_start', editor.models.AbilityLevelField(null=True)),
                ('ability_level_end', editor.models.AbilityLevelField(null=True)),
                ('ability_levels', models.ManyToManyField(to='editor.AbilityLevel')),
                ('access_rights', models.ManyToManyField(related_name='_editoritem_access_rights_+', editable=False, to=settings.AUTH_USER_MODEL, through='editor.Access', blank=True)),
                ('author', models.ForeignKey(related_name='own_items', to=settings.AUTH_USER_MODEL)),
                ('copy_of', models.ForeignKey(related_name='copies', on_delete=django.db.models.deletion.SET_NULL, to='editor.EditorItem', null=True)),
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

        # add Resource model
        migrations.CreateModel(
            name='Resource',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('date_created', models.DateTimeField(auto_now_add=True)),
                ('file', models.FileField(max_length=255, upload_to=b'question-resources/')),
                ('owner', models.ForeignKey(related_name='resources', to=settings.AUTH_USER_MODEL)),
            ],
        ),

        # add NewQuestion model
        migrations.CreateModel(
            name='NewQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('editoritem', models.OneToOneField(related_name='question', to='editor.EditorItem')),
                ('extensions', models.ManyToManyField(to='editor.Extension', blank=True)),
                ('resources', models.ManyToManyField(to='editor.Resource', blank=True)),
            ],
            options={
                'ordering': ['editoritem__name'],
                'permissions': (('highlight', 'Can pick questions to feature on the front page.'),),
            },
        ),

        # add NewExam model
        migrations.CreateModel(
            name='NewExam',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('theme', models.CharField(default=b'default', max_length=200, blank=True)),
                ('custom_theme', models.ForeignKey(related_name='used_in_newexams', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.Theme', null=True)),
                ('editoritem', models.OneToOneField(related_name='exam', to='editor.EditorItem')),
                ('locale',models.CharField(default=b'en-GB', max_length=200)),
            ],
        ),
        migrations.CreateModel(
            name='NewExamQuestion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('qn_order', models.PositiveIntegerField()),
                ('exam', models.ForeignKey(to='editor.NewExam')),
                ('question', models.ForeignKey(to='editor.NewQuestion')),
            ],
            options={
                'ordering': ['qn_order'],
            },
        ),
        migrations.AddField(
            model_name='newexam',
            name='questions',
            field=models.ManyToManyField(related_name='exams', editable=False, to='editor.NewQuestion', through='editor.NewExamQuestion', blank=True),
        ),

        # add NewStampOfApproval
        migrations.CreateModel(
            name='NewStampOfApproval',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('status', models.CharField(max_length=20, choices=[(b'ok', b'Ready to use'), (b'dontuse', b'Should not be used'), (b'problem', b'Has some problems'), (b'broken', b"Doesn't work"), (b'pleasetest', b'Needs to be tested')])),
                ('object',models.ForeignKey(related_name='stamps', to='editor.EditorItem')),
                ('user',models.ForeignKey(related_name='newstamps', to=settings.AUTH_USER_MODEL)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),
        migrations.AddField(
            model_name='editoritem',
            name='current_stamp',
            field=models.ForeignKey(on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.NewStampOfApproval', null=True),
        ),

        # add Project model
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=200)),
                ('owner', models.ForeignKey(related_name='own_projects', to=settings.AUTH_USER_MODEL)),
                ('description', models.TextField(blank=True)),
                ('default_licence', models.ForeignKey(blank=True, to='editor.Licence', null=True)),
                ('default_locale', models.CharField(default=b'en-GB', max_length=10)),
            ],
            bases=(models.Model, editor.models.ControlledObject),
        ),
        migrations.CreateModel(
            name='ProjectAccess',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('access', models.CharField(default=b'view', max_length=6, choices=[(b'view', b'Can view'), (b'edit', b'Can edit')])),
                ('project', models.ForeignKey(to='editor.Project')),
                ('user', models.ForeignKey(related_name='project_memberships', to=settings.AUTH_USER_MODEL)),
            ],
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
            field=models.ForeignKey(related_name='items', to='editor.Project', null=True),
        ),

        # make project and user unique together on ProjectAccess
        migrations.AlterUniqueTogether(
            name='projectaccess',
            unique_together=set([('project', 'user')]),
        ),

        # add TimelineItem model
        migrations.CreateModel(
            name='TimelineItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('timeline_id', models.PositiveIntegerField()),
                ('object_id', models.PositiveIntegerField()),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('object_content_type', models.ForeignKey(related_name='timelineitem_object', to='contenttypes.ContentType')),
                ('timeline_content_type', models.ForeignKey(related_name='timelineitem_timeline', to='contenttypes.ContentType')),
                ('user', models.ForeignKey(related_name='timelineitems', to=settings.AUTH_USER_MODEL, null=True)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='timelineitem',
            unique_together=set([('object_id', 'object_content_type')]),
        ),

        # alter ordering on lots of models
        migrations.AlterModelOptions(
            name='timelineitem',
            options={'ordering': ('-date',)},
        ),
        migrations.AlterModelOptions(
            name='abilityframework',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='editoritem',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='subject',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='topic',
            options={'ordering': ('name',)},
        ),
        migrations.AlterModelOptions(
            name='abilitylevel',
            options={'ordering': ('framework', 'start')},
        ),

        # add RestorePoint model
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

        #add ItemChangedTimelineItem model
        migrations.CreateModel(
            name='ItemChangedTimelineItem',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('verb', models.CharField(max_length=10, editable=False, choices=[(b'created', b'created')])),
                ('object', models.ForeignKey(to='editor.EditorItem')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            bases=(models.Model, editor.models.TimelineMixin),
        ),

        # add PullRequest model
        migrations.CreateModel(
            name='PullRequest',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('open', models.BooleanField(default=True)),
                ('accepted', models.BooleanField(default=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('comment', models.TextField(blank=True)),
                ('closed_by', models.ForeignKey(related_name='pullrequests_closed', on_delete=django.db.models.deletion.SET_NULL, blank=True, to=settings.AUTH_USER_MODEL, null=True)),
                ('destination', models.ForeignKey(related_name='incoming_pull_requests', to='editor.EditorItem')),
                ('owner', models.ForeignKey(related_name='pullrequests_created', to=settings.AUTH_USER_MODEL)),
                ('source', models.ForeignKey(related_name='outgoing_pull_requests', to='editor.EditorItem')),
            ],
            bases=(models.Model, editor.models.ControlledObject),
        ),

        # add ProjectInvitation model
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
