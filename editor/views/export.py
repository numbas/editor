from django.contrib import messages
from django.http import HttpResponseRedirect, JsonResponse
from django.views import generic
from django.urls import reverse
from django.utils import timezone
from pathlib import Path

from .generic import CanViewMixin
from .project import ProjectContextMixin

from editor.models import Project, User, DataExport
from editor.export import ProjectExporter, UserExporter
from editor.tasks import do_export

class ExportView(CanViewMixin, generic.DetailView):
    http_method_names = ['get', 'post', 'options'] # TODO - only POST

    def get_name(self):
        if hasattr(self, 'name'):
            return self.name

        raise NotImplementedError()

    def get_filename(self):
        raise NotImplementedError

    def get_exporter_cls(self):
        if hasattr(self, 'exporter_cls'):
            return self.exporter_cls
        else:
            raise NotImplementedError

    def get_exporter_kwargs(self):
        return {
            'pk': self.get_object().pk
        }

    def get_success_url(self):
        return reverse('profile_data_exports', args=(self.request.user.pk,))

    def dispatch(self, request, *args, **kwargs):
        de = DataExport.objects.create(
            name = self.get_name(),
            created_by = self.request.user,
            object = self.get_object()
        )

        now = timezone.now()
        filename = f'numbas-{self.get_filename()}-{now.strftime("%Y%m%d%H%M")}.zip'

        do_export(
            de,
            filename,
            self.get_exporter_cls(),
            self.get_exporter_kwargs(),
            {k:self.request.META[k] for k in ['SERVER_NAME', 'SERVER_PORT']}
        )

        messages.info(request, '''Your export has begun. We'll tell you when it's ready.''')

        return HttpResponseRedirect(self.get_success_url())


class ProjectExportView(ProjectContextMixin, ExportView):
    model = Project
    exporter_cls = ProjectExporter
    name = "Project"

    def get_filename(self):
        return 'project-'+self.get_object().name[:30]


class UserProfileExportView(ExportView):
    model = User
    exporter_cls = UserExporter
    name = "User profile"

    def get_object(self):
        return self.request.user

    def get_filename(self):
        return 'user-'+self.request.user.username[:30]
