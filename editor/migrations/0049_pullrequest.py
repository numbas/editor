# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import editor.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0048_auto_20160322_1415'),
    ]

    operations = [
        migrations.CreateModel(
            name='PullRequest',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('open', models.BooleanField(default=True)),
                ('accepted', models.BooleanField(default=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('comment', models.TextField(blank=True)),
                ('closed_by', models.ForeignKey(related_name='pullrequests_closed', to=settings.AUTH_USER_MODEL, null=True)),
                ('destination', models.ForeignKey(related_name='incoming_pull_requests', to='editor.EditorItem')),
                ('owner', models.ForeignKey(related_name='pullrequests_created', to=settings.AUTH_USER_MODEL)),
                ('source', models.ForeignKey(related_name='outgoing_pull_requests', to='editor.EditorItem')),
            ],
            bases=(models.Model, editor.models.ControlledObject),
        ),
    ]
