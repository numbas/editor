from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import editor.models

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('contenttypes', '0002_remove_content_type_name'),
        ('editor', '0057_queues'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customparttypeaccess',
            name='custom_part_type',
        ),
        migrations.RemoveField(
            model_name='customparttypeaccess',
            name='user',
        ),
        migrations.RemoveField(
            model_name='extensionaccess',
            name='extension',
        ),
        migrations.RemoveField(
            model_name='extensionaccess',
            name='user',
        ),
        migrations.AlterUniqueTogether(
            name='projectaccess',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='projectaccess',
            name='project',
        ),
        migrations.RemoveField(
            model_name='projectaccess',
            name='user',
        ),
        migrations.RemoveField(
            model_name='themeaccess',
            name='theme',
        ),
        migrations.RemoveField(
            model_name='themeaccess',
            name='user',
        ),
        migrations.RemoveField(
            model_name='editoritem',
            name='access_rights',
        ),
        migrations.RemoveField(
            model_name='editoritem',
            name='public_access',
        ),
        migrations.RemoveField(
            model_name='project',
            name='permissions',
        ),
        migrations.DeleteModel(
            name='Access',
        ),
        migrations.DeleteModel(
            name='CustomPartTypeAccess',
        ),
        migrations.DeleteModel(
            name='ExtensionAccess',
        ),
        migrations.DeleteModel(
            name='ProjectAccess',
        ),
        migrations.DeleteModel(
            name='ThemeAccess',
        ),
    ]

