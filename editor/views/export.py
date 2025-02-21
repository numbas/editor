from datetime import datetime
from django.conf import settings
from django.urls import reverse
from django.views import generic
from .generic import CanViewMixin, ZipResponse
from .project import ProjectContextMixin
import json
from pathlib import Path
import zipfile

import editor.models
from editor.models import Project, Resource, EditorItem, User

class ExportJSONEncoder(json.JSONEncoder):

    type_encoders = {
        datetime: lambda t: t.isoformat(),
    }

    def default(self, o):
        try:
            return self.type_encoders[type(o)](o)
        except KeyError:
            return super().default(o)

class Exporter:
    def __init__(self, request, zipfile):
        self.request = request
        self.zipfile = zipfile


    def get_root(self):
        return zipfile.Path(self.zipfile,'')


    def write_json(self, path, content):
        with path.open('w') as f:
            f.write(ExportJSONEncoder(indent=4).encode(content))


    def make_absolute(self, url):
        if self.request is not None:
            url = self.request.build_absolute_uri(url)
        return url


    def absolute_url(self, obj):
        return self.make_absolute(obj.get_absolute_url())


    def absolute_reverse(self, *args, **kwargs):
        return self.make_absolute(reverse(*args, **kwargs))


    def datetime_json(self, t):
        if t is None:
            return None

        return t.isoformat()


    def tags_json(self, tags):
        return list(tags.values_list('name', flat=True))


    def user_json(self, user):
        return {
            'id': user.pk,
            'name': user.get_full_name(),
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'url': self.absolute_reverse('view_profile', args=(user.pk,))
        }


    def stamp_json(self, stamp):
        return {
            'id': stamp.pk,
            'user': self.user_json(stamp.user),
            'status': stamp.status,
            'status_display': stamp.get_status_display(),
            'date': stamp.date,
        }


    def taxonomy_node_json(self, node):
        return {
            'id': node.pk,
            'name': node.name,
            'taxonomy': node.taxonomy.name,
            'code': node.code,
        }


    def timeline_item_json(self, ti):
        data = {
            'id': ti.pk,
            'date': ti.date
        }

        obj = ti.object

        if isinstance(obj, editor.models.IndividualAccess):
            data.update({
                'type': 'individual_access',
                'to_user': self.user_json(obj.user),
                'access': obj.access,
            })

        elif isinstance(obj, editor.models.PullRequest):
            data.update({
                'type': 'pull_request',
                'owner': self.user_json(obj.owner),
                'closed_by': self.user_json(obj.closed_by) if obj.closed_by else None,
                'source': self.absolute_url(obj.source),
                'destination': self.absolute_url(obj.destination),
                'open': obj.open,
                'accepted': obj.accepted,
                'created': obj.created,
                'comment': obj.comment,
            })

        elif isinstance(obj, editor.models.SiteBroadcast):
            data.update({
                'type': 'site_broadcast',
                'author': self.user_json(ti.author),
                'title': obj.title,
                'text': obj.text,
                'sticky': obj.sticky,
                'show_until': obj.show_until,
            })

        elif isinstance(obj, editor.models.NewStampOfApproval):
            data.update({
                'type': 'stamp',
                'user': self.user_json(obj.user),
                'status': obj.status,
            })

        elif isinstance(obj, editor.models.Comment):
            data.update({
                'type': 'comment',
                'user': self.user_json(obj.user),
                'text': obj.text,
            })

        elif isinstance(obj, editor.models.RestorePoint):
            data.update({
                'type': 'restore_point',
                'user': self.user_json(obj.user),
                'description': obj.description,
            })

        elif isinstance(obj, editor.models.ItemChangedTimelineItem):
            data.update({
                'type': 'item_changed',
                'user': self.user_json(obj.user),
                'verb': obj.verb,
            })

        elif isinstance(obj, editor.models.ItemQueueEntry):
            data.update({
                'type': 'added_to_queue',
                'url': self.absolute_url(obj),
            })

        if ti.user is not None:
            data['user'] = self.user_json(ti.user)

        return data

    def resource_json(self, resource):
        return {
            'id': resource.pk,
            'owner': self.user_json(resource.owner),
            'date_created': resource.date_created,
            'file': resource.file.name,
            'filename': resource.filename,
            'alt_text': resource.alt_text,
        }

    def exam_question_json(self, eq):
        return {
            'id': eq.pk,
            'question': self.absolute_url(eq.question),
            'qn_order': eq.qn_order,
            'group': eq.group,
        }

    def timeline_json(self, timeline):
        return [self.timeline_item_json(ti) for ti in timeline.all()]

    def item_json(self, item):
        data = {
            'id': item.pk,
            'url': self.absolute_url(item),
            'name': item.name,
            'slug': item.slug,
            'item_type': item.item_type,
            'author': self.user_json(item.author),
            'contributors': [self.user_json(c.user) if c.user is not None else {'name': c.name, 'url': c.profile_url} for c in item.contributors.all()],
            'licence': item.licence.as_json() if item.licence else None,
            'created': item.created,
            'last_modified': item.created,
            'copy_of': self.absolute_url(item.copy_of) if item.copy_of else None,
            'tags': self.tags_json(item.tags),
            'current_stamp': self.stamp_json(item.current_stamp) if item.current_stamp else None,
            'published': item.published,
            'published_date': item.published_date,
            'ability_levels': [al.name for al in item.ability_levels.all()],
            'taxonomy_nodes': [self.taxonomy_node_json(node) for node in item.taxonomy_nodes.all()],
            'timeline': self.timeline_json(item.timeline),
        }

        try:
            q = item.question
            data.update({
                'resources': [self.resource_json(r) for r in q.resources.all()],
                'extensions': [e.location for e in q.extensions.all()],
                'custom_part_types': [c.short_name for c in q.custom_part_types.all()],
            })
        except editor.models.NewQuestion.DoesNotExist:
            pass

        try:
            e = item.exam
            data.update({
                'questions': [self.exam_question_json(eq) for eq in editor.models.NewExamQuestion.objects.filter(exam=e)],
                'theme': e.theme,
                'custom_theme': e.custom_theme.name if e.custom_theme else None,
                'locale': e.locale,
            })
        except editor.models.NewExam.DoesNotExist:
            pass

        return data

    def item_queue_entry_json(self, entry):
        return {
            'id': entry.pk,
            'statuses': self.tags_json(entry.statuses),
            'assigned_user': self.user_json(entry.assigned_user) if entry.assigned_user else None,
            'item': self.absolute_url(entry.item),
            'created_by': self.user_json(entry.created_by),
            'note': entry.note,
            'complete': entry.complete,
            'timeline': self.timeline_json(entry.timeline),
            'checklist': {c.label: c.ticked for c in entry.checklist_items()},
        }

    def item_queue_checklist_item_json(self, c):
        return {
            'id': c.pk,
            'position': c.position,
            'label': c.label,
        }

    def item_queue_json(self, queue):
        return {
            'id': queue.pk,
            'owner': self.user_json(queue.owner),
            'name': queue.name,
            'description': queue.description,
            'instructions_submitter': queue.instructions_submitter,
            'instructions_reviewer': queue.instructions_reviewer,
            'public': queue.public,
            'statuses': self.tags_json(queue.statuses),
            'members': [self.user_json(u) for u in User.objects.filter(individual_accesses__item_queue=queue)],
            'entries': [self.item_queue_entry_json(entry) for entry in queue.entries.all()],
            'checklist': [self.item_queue_checklist_item_json(c) for c in queue.checklist.all()],
        }


    def project_json(self, project):
        data = {
            'name': project.name,
            'id': project.pk,
            'owner': self.user_json(project.owner),
            'url': self.absolute_url(project),
            'members': [self.user_json(u) for u in project.members()],
            'is_published': project.public_view,
            'description': project.description,
            'default_locale': project.default_locale,
            'default_licence': project.default_licence.as_json() if project.default_licence else None,
            'queues': [self.item_queue_json(queue) for queue in project.queues.all()],
        }

        return data


    def individual_access_json(self, access):
        return {
            'id': access.pk,
            'object_type': access.object_content_type.name,
            'object': self.get_absolute_url(access.object),
            'access': access.access,
        }


    def project_invitation_json(self, invitation):
        return {
            'id': invitation.pk,
            'email': invitation.email,
            'access': invitation.access,
            'project': self.get_absolute_url(invitation.project),
            'applied': invitation.applied,
        }
    

    def userprofile_json(self, userprofile):
        user = userprofile.user
        user_data = self.user_json(user)

        user_data.update({
            'email': user.email,
            'last_login': user.last_login,
            'date_joined': user.last_login,
        })

        return {
            'user': user_data,
            'language': userprofile.language,
            'bio': userprofile.bio,
            'question_basket': [self.absolute_url(q) for q in userprofile.question_basket.all()],
            'personal_project': self.absolute_url(userprofile.personal_project),
            'wrap_lines': userprofile.wrap_lines,
            'mathjax_url': userprofile.mathjax_url,

            'never_email': userprofile.never_email,

            'recent_questions': [self.absolute_url(q) for q in userprofile.recent_questions()],

            'projects': [
                {
                    'url': self.absolute_url(p),
                    'is_owner': p.owner == userprofile.user,
                }
                for p in userprofile.projects()
            ],

            'accesses': [self.individual_access_json(access) for access in user.individual_accesses.all()],

            'available_queues': [self.get_absolute_url(q) for q in userprofile.available_queues()],

            'project_invitations': [self.project_invitation_json(invitation) for invitation in user.project_invitations.all()],

            'last_viewed_items': [
                {
                    'item': self.get_absolute_url(v.item),
                    'date': v.date
                }
                for v in userprofile.last_viewed_items()
            ],


        }


    def extension_json(self, extension):
        return {
            'id': extension.pk,
            'url': self.absolute_url(extension),
            'name': extension.name,
            'location': extension.location,
            'documentation': extension.url,
            'public': extension.public,
            'slug': extension.slug,
            'author': self.user_json(extension.author),
            'last_modified': extension.last_modified,
            'editable': extension.editable,
            'runs_headless': extension.runs_headless,
            'access': [
                {
                    'user': self.user_json(access.user),
                    'access': access.access,
                }
                for access in extension.access.all()
            ],
        }


class ProjectExporter(Exporter):
    def export(self, project):
        self.export_metadata()
        self.export_folders()
        self.export_resources()

    def export_metadata(self):
        self.write_json(self.get_root() / 'project.json', self.project_json(project))

    def export_folders(self):
        def handle_folder(node, path):
            folder = node['folder']

            fpath = path / folder.name

            for subfolder in node['subfolders']:
                handle_folder(subfolder, fpath)

            for item in folder.items.all():
                handle_item(item, fpath)

        def handle_item(item, path):
            item_path = path / f'{item.item_type}-{item.pk}-{item.slug}'
            with (item_path / 'source.exam').open('w') as f:
                numbasobj = item.as_numbasobject(self.request)
                f.write(str(numbasobj))
            self.write_json(item_path / 'metadata.json', self.item_json(item))

        root = self.get_root()
            
        for folder in project.folder_hierarchy():
            handle_folder(folder,root)

        for item in EditorItem.objects.filter(project=project, folder=None):
            handle_item(item, root)

    def export_resources(self):
        root = self.get_root()
        for resource in Resource.objects.filter(questions__editoritem__project=project).distinct():
            with (root / 'resources' / resource.file.name).open('wb') as f:
                f.write(resource.file.file.read())


class UserExporter(Exporter):
    def export(self, user):
        self.user = user
        self.export_metadata()
        self.export_extensions()

    def export_metadata(self):
        userprofile = self.user.userprofile

        self.write_json(self.get_root() / 'profile.json', self.userprofile_json(userprofile))

        try:
            avatar_path = Path(user.userprofile.avatar.path)
            with (root / 'avatar').with_suffix(avatar_path.suffix).open('wb') as f:
                with avatar_path.open('rb') as af:
                    f.write(af.read())
        except ValueError:
            pass

    def export_extensions(self):
        user = self.user

        path = self.get_root() / 'extensions'
        for extension in user.own_extensions.all():
            epath = path / extension.location

            self.write_json(epath / 'extension.json', self.extension_json(extension))

            for fname in extension.filenames():
                (epath / fname).write(Path(extension.extracted_path) / fname)


class ExportView(CanViewMixin, generic.DetailView):
    http_method_names = ['get', 'post', 'options']

    def get_filename(self):
        raise NotImplementedError

    def get_exporter_cls(self):
        if hasattr(self, 'exporter_cls'):
            return self.exporter_cls
        else:
            raise NotImplementedError

    def dispatch(self, request, *args, **kwargs):
        obj = self.get_object()

        response = ZipResponse(self.get_filename())

        zf = response.zipfile
        
        exporter_cls = self.get_exporter_cls()

        exporter = exporter_cls(request, zf)

        exporter.export(obj)

        zf.close()

        return response

class ProjectExportView(ProjectContextMixin, ExportView):
    model = Project
    exporter_cls = ProjectExporter

    def get_filename(self):
        return self.get_object().name

class UserProfileExportView(ExportView):
    model = User
    exporter_cls = ProjectExporter

    def get_object(self):
        return self.request.user

    def get_filename(self):
        return self.request.user.username
