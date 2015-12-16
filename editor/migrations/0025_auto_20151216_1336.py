# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0024_auto_20151215_1535'),
    ]

    operations = [
        migrations.AlterField(
            model_name='newexam',
            name='editoritem',
            field=models.OneToOneField(related_name='exam', to='editor.EditorItem'),
        ),
        migrations.AlterField(
            model_name='newquestion',
            name='editoritem',
            field=models.OneToOneField(related_name='question', to='editor.EditorItem'),
        ),
    ]
