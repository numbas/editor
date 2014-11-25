from django.core.urlresolvers import reverse
from django.views import generic
from editor.views.generic import user_json
from reversion.models import Version
from django import http

# JSON representation of a reversion.models.Version object
def version_json(version,viewing_user):
    revision = version.revision
    return {
        'version_pk': version.pk,
        'revision_pk': revision.pk,
        'user': user_json(revision.user),
        'date_created': revision.date_created.strftime('%Y-%m-%d %H:%M:%S'),
        'comment': revision.comment,
        'editable': (viewing_user == revision.user) or viewing_user.is_superuser,
        'update_url': reverse('edit_version',args=(version.pk,)),
    }


class UpdateView(generic.UpdateView):
    model = Version

    def post(self, request, *args, **kwargs):
        version = self.get_object()
        revision = version.revision

        if not (request.user == revision.user or request.user.is_superuser):
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

        version.revision.comment = request.POST['comment']

        version.revision.save()

        return http.HttpResponse('ok', content_type='text/plain')
