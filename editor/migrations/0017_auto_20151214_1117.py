# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0016_newquestion'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewExam',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('theme', models.CharField(default=b'default', max_length=200, blank=True)),
                ('custom_theme', models.ForeignKey(related_name='used_in_newexams', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='editor.Theme', null=True)),
                ('editoritem', models.ForeignKey(related_name='exam', to='editor.EditorItem')),
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
            field=models.ManyToManyField(to='editor.NewQuestion', editable=False, through='editor.NewExamQuestion', blank=True),
        ),
    ]
