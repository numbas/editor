# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('editor', '0006_add_please_test_stamp'),
    ]

    operations = [
        migrations.CreateModel(
            name='QuestionPullRequest',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('open', models.BooleanField(default=False)),
                ('destination', models.ForeignKey(related_name='incoming_pull_requests', to='editor.Question', on_delete=models.CASCADE)),
                ('owner', models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE)),
                ('source', models.ForeignKey(related_name='outgoing_pull_requests', to='editor.Question', on_delete=models.CASCADE)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
