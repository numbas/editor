# Generated by Django 3.2.4 on 2021-08-16 10:44

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0053_auto_20210308_1105'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customparttype',
            name='extensions',
            field=models.ManyToManyField(blank=True, related_name='custom_part_types', to='editor.Extension'),
        ),
        migrations.AlterField(
            model_name='newquestion',
            name='extensions',
            field=models.ManyToManyField(blank=True, related_name='questions', to='editor.Extension'),
        ),
        migrations.AlterField(
            model_name='newquestion',
            name='resources',
            field=models.ManyToManyField(blank=True, related_name='questions', to='editor.Resource'),
        ),
    ]