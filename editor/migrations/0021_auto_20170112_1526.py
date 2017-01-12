# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0020_newexamquestion_group'),
    ]

    operations = [
        migrations.AlterField(
            model_name='access',
            name='access',
            field=models.CharField(default='view', max_length=6, choices=[('view', 'Can view'), ('edit', 'Can edit')]),
        ),
        migrations.AlterField(
            model_name='editoritem',
            name='public_access',
            field=models.CharField(default='view', max_length=6, choices=[('hidden', 'Hidden'), ('view', 'Public can view'), ('edit', 'Public can edit')]),
        ),
        migrations.AlterField(
            model_name='exam',
            name='filename',
            field=models.CharField(editable=False, default='', max_length=200),
        ),
        migrations.AlterField(
            model_name='exam',
            name='locale',
            field=models.CharField(default='en-GB', max_length=200),
        ),
        migrations.AlterField(
            model_name='exam',
            name='name',
            field=models.CharField(default='Untitled Exam', max_length=200),
        ),
        migrations.AlterField(
            model_name='exam',
            name='public_access',
            field=models.CharField(default='view', max_length=6, choices=[('hidden', 'Hidden'), ('view', 'Public can view'), ('edit', 'Public can edit')]),
        ),
        migrations.AlterField(
            model_name='exam',
            name='theme',
            field=models.CharField(default='default', max_length=200, blank=True),
        ),
        migrations.AlterField(
            model_name='examaccess',
            name='access',
            field=models.CharField(default='view', max_length=6, choices=[('view', 'Can view'), ('edit', 'Can edit')]),
        ),
        migrations.AlterField(
            model_name='extension',
            name='location',
            field=models.CharField(help_text='A unique identifier for this extension', max_length=200, unique=True, blank=True, verbose_name='Short name', default=''),
        ),
        migrations.AlterField(
            model_name='extension',
            name='name',
            field=models.CharField(help_text='A human-readable name for the extension', max_length=200),
        ),
        migrations.AlterField(
            model_name='extension',
            name='public',
            field=models.BooleanField(help_text='Can this extension be seen by everyone?', default=False),
        ),
        migrations.AlterField(
            model_name='extension',
            name='slug',
            field=models.SlugField(editable=False, default='an-extension', max_length=200),
        ),
        migrations.AlterField(
            model_name='extension',
            name='url',
            field=models.CharField(verbose_name='Documentation URL', max_length=300, help_text='Address of a page about the extension', blank=True),
        ),
        migrations.AlterField(
            model_name='extension',
            name='zipfile',
            field=models.FileField(help_text="A .zip package containing the extension's files", max_length=255, blank=True, null=True, verbose_name='Extension package', upload_to='user-extensions/zips'),
        ),
        migrations.AlterField(
            model_name='image',
            name='image',
            field=models.ImageField(max_length=255, upload_to='question-resources/'),
        ),
        migrations.AlterField(
            model_name='itemchangedtimelineitem',
            name='verb',
            field=models.CharField(editable=False, max_length=10, choices=[('created', 'created')]),
        ),
        migrations.AlterField(
            model_name='newexam',
            name='locale',
            field=models.CharField(default='en-GB', max_length=200),
        ),
        migrations.AlterField(
            model_name='newexam',
            name='theme',
            field=models.CharField(default='default', max_length=200, blank=True),
        ),
        migrations.AlterField(
            model_name='newstampofapproval',
            name='status',
            field=models.CharField(max_length=20, choices=[('ok', 'Ready to use'), ('dontuse', 'Should not be used'), ('problem', 'Has some problems'), ('broken', "Doesn't work"), ('pleasetest', 'Needs to be tested')]),
        ),
        migrations.AlterField(
            model_name='project',
            name='default_locale',
            field=models.CharField(default='en-GB', max_length=10),
        ),
        migrations.AlterField(
            model_name='projectaccess',
            name='access',
            field=models.CharField(default='view', max_length=6, choices=[('view', 'Can view'), ('edit', 'Can edit')]),
        ),
        migrations.AlterField(
            model_name='projectinvitation',
            name='access',
            field=models.CharField(default='view', max_length=6, choices=[('view', 'Can view'), ('edit', 'Can edit')]),
        ),
        migrations.AlterField(
            model_name='question',
            name='filename',
            field=models.CharField(editable=False, default='', max_length=200),
        ),
        migrations.AlterField(
            model_name='question',
            name='name',
            field=models.CharField(default='Untitled Question', max_length=200),
        ),
        migrations.AlterField(
            model_name='question',
            name='public_access',
            field=models.CharField(default='view', max_length=6, choices=[('hidden', 'Hidden'), ('view', 'Public can view'), ('edit', 'Public can edit')]),
        ),
        migrations.AlterField(
            model_name='questionaccess',
            name='access',
            field=models.CharField(default='view', max_length=6, choices=[('view', 'Can view'), ('edit', 'Can edit')]),
        ),
        migrations.AlterField(
            model_name='resource',
            name='file',
            field=models.FileField(max_length=255, upload_to='question-resources/'),
        ),
        migrations.AlterField(
            model_name='stampofapproval',
            name='status',
            field=models.CharField(max_length=20, choices=[('ok', 'Ready to use'), ('dontuse', 'Should not be used'), ('problem', 'Has some problems'), ('broken', "Doesn't work"), ('pleasetest', 'Needs to be tested')]),
        ),
        migrations.AlterField(
            model_name='theme',
            name='public',
            field=models.BooleanField(help_text='Can this theme be seen by everyone?', default=False),
        ),
        migrations.AlterField(
            model_name='theme',
            name='zipfile',
            field=models.FileField(verbose_name='Theme package', max_length=255, upload_to='user-themes/zips', help_text="A .zip package containing the theme's files"),
        ),
    ]
