# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import sanitizer.models


class Migration(migrations.Migration):

    dependencies = [
        ('registration', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegistrationProfile',
            fields=[
                ('registrationprofile_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='registration.RegistrationProfile')),
            ],
            options={
            },
            bases=('registration.registrationprofile',),
        ),
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('language', models.CharField(default=b'en-GB', max_length=100)),
                ('bio', sanitizer.models.SanitizedTextField(default=b'')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
