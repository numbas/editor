# Generated by Django 4.1 on 2022-11-22 10:53

from django.db import migrations, models
import django.db.models.deletion
import django.db.models.functions.text


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('editor', '0062_itemqueueentry_assigned_user'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='abilityframework',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterModelOptions(
            name='customparttype',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterModelOptions(
            name='editoritem',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterModelOptions(
            name='editortag',
            options={'ordering': (django.db.models.functions.text.Lower('name'),), 'verbose_name': 'tag'},
        ),
        migrations.AlterModelOptions(
            name='extension',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterModelOptions(
            name='folder',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterModelOptions(
            name='newexamquestion',
            options={'ordering': ('qn_order',)},
        ),
        migrations.AlterModelOptions(
            name='newquestion',
            options={'ordering': (django.db.models.functions.text.Lower('editoritem__name'),), 'permissions': (('highlight', 'Can pick questions to feature on the front page.'),), 'verbose_name': 'question'},
        ),
        migrations.AlterModelOptions(
            name='project',
            options={'ordering': (django.db.models.functions.text.Lower('name'),)},
        ),
        migrations.AlterField(
            model_name='editortag',
            name='slug',
            field=models.SlugField(allow_unicode=True, max_length=100, unique=True, verbose_name='slug'),
        ),
        migrations.AlterField(
            model_name='taggeditem',
            name='content_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(app_label)s_%(class)s_tagged_items', to='contenttypes.contenttype', verbose_name='content type'),
        ),
        migrations.AlterField(
            model_name='taggedquestion',
            name='content_type',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='%(app_label)s_%(class)s_tagged_items', to='contenttypes.contenttype', verbose_name='content type'),
        ),
    ]
