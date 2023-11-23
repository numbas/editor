import json
import traceback

from django.core.exceptions import ObjectDoesNotExist
from django.urls import reverse
from django.db import transaction
from django.db.models import Q
from django.db.models.functions import Lower
from django.http import Http404
from django import http
from django.shortcuts import redirect
from django.views import generic

import reversion

from editor.forms import NewQuestionForm, QuestionForm, ResourcesAltTextForm
from editor.models import NewQuestion, Extension, Resource, CustomPartType
import editor.views.generic
import editor.views.editoritem

from accounts.models import UserProfile

class PreviewView(editor.views.editoritem.PreviewView):
    """Compile question as a preview."""
    model = NewQuestion

class EmbedView(editor.views.editoritem.EmbedView):
    """Compile question and show it."""
    model = NewQuestion

class ZipView(editor.views.editoritem.ZipView):
    """Compile a question as a SCORM package and return the .zip file"""
    model = NewQuestion

class SourceView(editor.views.editoritem.SourceView):
    """Serve the source .exam file for this question"""
    model = NewQuestion

class CreateView(editor.views.editoritem.CreateView):
    
    """Create a question."""
    
    form_class = NewQuestionForm
    template_name = 'question/new.html'

    def form_valid(self, form):
        with transaction.atomic(), reversion.create_revision():
            ei = form.save()
            content = ei.get_parsed_content()
            content.data['partsMode'] = form.cleaned_data.get('parts_mode')
            ei.content = str(content)
            ei.set_licence(ei.project.default_licence)
            ei.save()
            self.question = NewQuestion()
            self.question.editoritem = ei
            self.question.save()
            reversion.set_user(ei.author)

        return redirect(self.get_success_url())
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.question.pk,
                                              self.question.editoritem.slug,))
 
 
class CopyView(editor.views.editoritem.CopyView):

    """ Copy a question """

    model = NewQuestion

class DeleteView(generic.DeleteView):
    
    """Delete a question."""
    
    model = NewQuestion
    template_name = 'question/delete.html'
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        return self.try_delete()

    def form_valid(self, form):
        return self.try_delete()

    def do_delete(self):
        self.object.editoritem.delete()
        return http.HttpResponseRedirect(self.get_success_url())

    def try_delete(self):
        if self.object.editoritem.can_be_deleted_by(self.request.user):
            return self.do_delete()
        elif self.request.user.is_superuser:
            if not self.request.POST.get('confirmed'):
                return self.response_class(
                    request=self.request,
                    template='editoritem/superuser_confirm_delete.html',
                    context=self.get_context_data(object=self.object),
                    using=self.template_engine
                )
            else:
                return self.do_delete()
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
    
    def get_success_url(self):
        return reverse('editor_index')


class UpdateView(editor.views.editoritem.BaseUpdateView):

    model = NewQuestion
    form_class = QuestionForm
    template_name = 'question/edit.html'

    def form_valid(self, *args, **kwargs):
        self.resources_form.save()
        return super().form_valid(*args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        super(UpdateView, self).post(request, *args, **kwargs)

        self.resources = self.data['resources']
        del self.data['resources']
        question_form = QuestionForm(self.data, instance=self.object)
        data = {
            'form-TOTAL_FORMS': len(self.resources),
            'form-INITIAL_FORMS': len(self.resources),
        }
        for i,rd in enumerate(self.resources):
            data['form-{}-id'.format(i)] = rd['pk']
            data['form-{}-alt_text'.format(i)] = rd['alt_text']
        self.resources_form = ResourcesAltTextForm(data=data)

        if question_form.is_valid() and self.resources_form.is_valid():
            return self.form_valid(question_form)
        else:
            return self.form_invalid(question_form)
    
    def pre_save(self, form):
        self.object.editoritem.metadata = json.dumps(self.object.editoritem.metadata)
        self.object.extensions.clear()
        self.object.extensions.add(*form.cleaned_data['extensions'])

        resource_pks = [res['pk'] for res in self.resources]
        self.object.resources.set(Resource.objects.filter(pk__in=resource_pks))
    
    def get_context_data(self, **kwargs):
        context = super(UpdateView, self).get_context_data(**kwargs)

        extensions = Extension.objects.filter(Extension.filter_can_be_viewed_by(self.request.user)) | self.object.extensions.all()
        extensions = extensions.distinct().order_by(Lower('name'))
        self.item_json['numbasExtensions'] = context['extensions'] = [e.as_json() for e in extensions]

        self.item_json['used_in_exams'] = self.object.exams_using_this.exists()
        user = self.request.user
        network, network_hidden_items = self.object.editoritem.network(user=self.request.user)
        context['network'] = network
        context['network_hidden_items'] = network_hidden_items
        context['other_versions_exist'] = self.item_json['other_versions_exist'] = len(network) > 1
        self.item_json['editing_history_used'] = self.object.editoritem.comments.exists() or self.object.editoritem.restore_points.exists()

        # get publicly available part types first
        custom_part_types = CustomPartType.objects.filter(public_availability='always')
        if not self.request.user.is_anonymous:
            # add in the user's own part types
            users = [self.request.user]+self.object.editoritem.project.members()
            custom_part_types |= CustomPartType.objects.filter(CustomPartType.filter_can_be_viewed_by(self.request.user))
        # only show part types ready to use
        custom_part_types = custom_part_types.filter(ready_to_use=True)
        # also include part types already in use in this question
        custom_part_types = custom_part_types | self.object.custom_part_types.all()
        custom_part_types = custom_part_types.distinct()
        self.item_json['custom_part_types'] = context['custom_part_types'] = [c.as_json() for c in custom_part_types]

        self.item_json['resources'] = [r.as_json() for r in self.object.resources.all()]

        part_type_path = 'question/part_types/'
        context['partNames'] = [
            (name, '{}/{}.html'.format(part_type_path, name)) 
            for name in 
            ('information', 'jme', 'gapfill', 'numberentry', 'patternmatch', '1_n_2', 'm_n_2', 'm_n_x', 'matrix', 'extension')
        ]

        return context
    
    def get_success_url(self):
        return reverse('question_edit', args=(self.object.pk, self.object.editoritem.slug))


class RevertView(generic.UpdateView):
    model = NewQuestion
    
    def get(self, request, *args, **kwargs):
        self.user = request.user
        self.question = self.get_object()

        if not self.question.editoritem.can_be_edited_by(self.user):
            return http.HttpResponseForbidden()

        try:
            self.version = reversion.models.Version.objects.get(pk=kwargs['version'])
        except ObjectDoesNotExist:
            raise Http404

        self.version.revision.revert()

        return redirect(reverse('question_edit', args=(self.question.pk, self.question.editoritem.slug)))
    
class ShareLinkView(editor.views.generic.ShareLinkView):
    permanent = False
    model = NewQuestion

class StampView(editor.views.generic.StampView):
    model = NewQuestion

class CommentView(editor.views.generic.CommentView):
    model = NewQuestion

    def get_comment_object(self):
        return self.get_object().editoritem

class SetRestorePointView(editor.views.generic.SetRestorePointView):
    model = NewQuestion
