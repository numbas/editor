# Generated by Django 4.2.6 on 2025-02-14 13:50

from django.db import migrations, models
import os.path

def set_filename(apps, schema_editor):
    Resource = apps.get_model('editor', 'Resource')

    for resource in Resource.objects.all():
        resource.filename = os.path.basename(resource.file.name)
        resource.save()


class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0064_alter_editoritem_options'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='filename',
            field=models.CharField(default='', max_length=255),
            preserve_default=False,
        ),
        migrations.RunPython(set_filename, migrations.RunPython.noop),
    ]
