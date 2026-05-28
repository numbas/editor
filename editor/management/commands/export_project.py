from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.http import HttpRequest
from django.conf import settings

from editor.export import ProjectExporter
import zipfile

from editor.models import Project

class Command(BaseCommand):
    help = 'Export a project'

    def add_arguments(self, parser):
        parser.add_argument('project', type=int)
        parser.add_argument('outfile')

    def handle(self, *args, **options):
        project = Project.objects.get(pk=options['project'])

        zf = zipfile.ZipFile(options['outfile'], 'w')

        r = HttpRequest()

        r.META = {'SERVER_NAME': settings.ALLOWED_HOSTS[0], 'SERVER_PORT': '80'}

        pe = ProjectExporter(r, zf, pk=project.pk)

        pe.export()
