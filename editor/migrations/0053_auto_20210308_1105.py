# Generated by Django 3.1 on 2021-03-08 11:05

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0052_auto_20201029_1046'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='topic',
            name='subjects',
        ),
        migrations.RemoveField(
            model_name='editoritem',
            name='subjects',
        ),
        migrations.RemoveField(
            model_name='editoritem',
            name='topics',
        ),
        migrations.DeleteModel(
            name='Subject',
        ),
        migrations.DeleteModel(
            name='Topic',
        ),
    ]
