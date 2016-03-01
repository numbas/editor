# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

def make_personal_workspaces(apps, schema_editor):
    Project = apps.get_model('editor','Project')
    UserProfile = apps.get_model('accounts','UserProfile')

    for up in UserProfile.objects.all():
        project = Project.objects.create(
            name="{}'s workspace".format(up.user.first_name),
            owner=up.user
        )
        up.personal_project = project
        up.save()

def delete_personal_workspaces(apps, schema_editor):
    Project = apps.get_model('editor','Project')
    UserProfile = apps.get_model('accounts','UserProfile')

    for up in UserProfile.objects.all():
        up.personal_project.delete()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_userprofile_personal_project'),
        ('editor','0029_project'),
    ]

    operations = [
        migrations.RunPython(make_personal_workspaces,delete_personal_workspaces),
    ]