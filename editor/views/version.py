from django.core.urlresolvers import reverse
from django.views import generic
from editor.views.generic import user_json
from reversion.models import Version
from django import http
from editor.notify_watching import notify_watching
from django.contrib.contenttypes.models import ContentType

# JSON representation of a reversion.models.Version object
def version_json(version,viewed_by):
    revision = version.revision
    return {
        'version_pk': version.pk,
        'revision_pk': revision.pk,
        'user': user_json(revision.user),
        'date_created': revision.date_created.strftime('%Y-%m-%d %H:%M:%S'),
        'comment': revision.comment,
        'editable': (viewed_by == revision.user) or viewed_by.is_superuser,
        'update_url': reverse('edit_version',args=(version.pk,)),
    }


class UpdateView(generic.UpdateView):
    model = Version

    def post(self, request, *args, **kwargs):
        version = self.get_object()
        revision = version.revision

        if not (request.user == revision.user or request.user.is_superuser):
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

        editoritem = revision.version_set.get(content_type=ContentType.objects.get(app_label='editor',model='editoritem')).object
        if not version.revision.comment:
            notify_watching(request.user,verb='made changes to',target=editoritem)

        version.revision.comment = request.POST['comment']

        version.revision.save()

        return http.HttpResponse('ok', content_type='text/plain')
