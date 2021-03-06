# Generated by Django 2.0.5 on 2018-06-26 09:05

from django.db import migrations
from itertools import groupby

def set_contributors(apps, schema_editor):

    EditorItem = apps.get_model('editor','EditorItem')
    Revision = apps.get_model('reversion','Revision')
    ContentType = apps.get_model('contenttypes','ContentType')
    User = apps.get_model('auth','User')
    Contributor = apps.get_model('editor','Contributor')

    ct = ContentType.objects.get_for_model(EditorItem)

    revisions = Revision.objects.filter(version__content_type=ct).order_by('version__object_id','user').values('version__object_id','user').distinct()
    item_contributors = {}
    for item_pk, values in groupby(revisions, key=lambda x: x['version__object_id']):
        try:
            item = EditorItem.objects.get(pk=item_pk)
        except EditorItem.DoesNotExist:
            continue
        users = set(User.objects.filter(pk__in=[v['user'] for v in values]))
        users.add(item.author)
        item_contributors[int(item_pk)] = users

    for item in EditorItem.objects.all():
        contributors = item_contributors.get(item.pk, [item.author])
        for user in contributors:
            Contributor.objects.create(item=item,user=user)

class Migration(migrations.Migration):

    dependencies = [
        ('editor', '0033_editoritem_contributors'),
    ]

    operations = [
        migrations.RunPython(set_contributors, migrations.RunPython.noop)
    ]
