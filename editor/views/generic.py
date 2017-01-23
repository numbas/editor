import json
import os
import subprocess
import traceback

from django.shortcuts import render,redirect,render_to_response
from django.conf import settings
from django.core.urlresolvers import reverse
from django import http
from django.views import generic
from django.template.loader import get_template
from django.template import RequestContext
import reversion

from editor.models import Extension,NewStampOfApproval,Comment,RestorePoint,TimelineItem,EditorItem, Access

from accounts.util import user_json

# from http://stackoverflow.com/questions/18172102/object-ownership-validation-in-django-updateview
class AuthorRequiredMixin(object):
    def dispatch(self, request, *args, **kwargs):
        result = super(AuthorRequiredMixin, self).dispatch(request, *args, **kwargs)
        if self.object.author != self.request.user:
            template = get_template("403.html")
            return http.HttpResponseForbidden(template.render(RequestContext(self.request)))
        return result

class TimelineItemViewMixin(object):
    def response(self):
        data = {
            'object_json': self.object_json(),
            'html': self.object_html(),
        }
        return http.HttpResponse(json.dumps(data),content_type='application/json')

    def object_html(self):
        template = get_template(self.item.timelineitem_template)
        html = template.render(RequestContext(self.request,{'item': self.item.timelineitem, 'can_delete': self.item.can_be_deleted_by(self.request.user)}))
        return html

class StampView(generic.UpdateView,TimelineItemViewMixin):
    def post(self, request, *args, **kwargs):
        object = self.get_object()

        status = request.POST.get('status')

        stamp = self.item = NewStampOfApproval.objects.create(user=request.user,object=object.editoritem,status=status)

        return self.response()

    def object_json(self):
        return stamp_json(self.item)

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class CommentView(generic.UpdateView,TimelineItemViewMixin):
    def post(self, request, *args, **kwargs):
        object = self.get_comment_object()

        text = request.POST.get('text')

        self.item = Comment.objects.create(user=request.user,object=object,text=text)

        return self.response()

    def object_json(self):
        return comment_json(self.item)

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class SetRestorePointView(generic.UpdateView,TimelineItemViewMixin):
    def post(self, request, *args, **kwargs):
        object = self.get_object()
    
        description = request.POST.get('text')
        revision = reversion.get_for_object(object).first().revision

        restore_point = self.item = RestorePoint.objects.create(user=request.user,object=object.editoritem,description=description,revision=revision)

        return self.response()

    def object_json(self):
        return restore_point_json(self.item)

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class RevertRestorePointView(generic.UpdateView):
    model = RestorePoint
    def get(self,request, *args, **kwargs):
        self.restore_point = self.get_object()
        if not self.restore_point.object.can_be_edited_by(request.user):
            return http.HttpResponseForbidden()

        oei = self.restore_point.object
        project = oei.project
        self.restore_point.revision.revert()

        ei = EditorItem.objects.get(pk=oei.pk)
        ei.project = project
        ei.save()

        return redirect(self.restore_point.object.get_absolute_url())

# JSON representation of a editor.models.StampOfApproval object
def stamp_json(stamp,**kwargs):
    return {
        'pk': stamp.pk,
        'date': stamp.timelineitem.date.strftime('%Y-%m-%d %H:%M:%S'),
        'status': stamp.status,
        'status_display': stamp.get_status_display(),
        'user': user_json(stamp.user),
    }

# JSON representation of a editor.models.Comment object
def comment_json(comment,**kwargs):
    return {
        'pk': comment.pk,
        'date': comment.timelineitem.date.strftime('%Y-%m-%d %H:%M:%S'),
        'text': comment.text,
        'user': user_json(comment.user),
    }

def restore_point_json(restore_point,**kwargs):
    return {
        'pk': restore_point.pk,
        'date': restore_point.timelineitem.date.strftime('%Y-%m-%d %H:%M:%S'),
        'description': restore_point.description,
        'user': user_json(restore_point.user),
    }

def topic_json(topic):
    return {
        'pk': topic.pk,
        'name': topic.name,
        'description': topic.description,
        'subjects': [s.pk for s in topic.subjects.all()],
    }

def subject_json(subject):
    return {
        'pk': subject.pk,
        'name': subject.name,
        'description': subject.description,
    }

def ability_framework_json(ability_framework):
    return {
        'pk': ability_framework.pk,
        'name': ability_framework.name,
        'description': ability_framework.description,
        'levels': [ability_level_json(l) for l in ability_framework.levels.all()],
    }

def ability_level_json(ability_level):
    return {
        'pk': ability_level.pk,
        'name': ability_level.name,
        'description': ability_level.description,
        'framework': ability_level.framework.pk,
        'start': float(ability_level.start),
        'end': float(ability_level.end),
    }

class DeleteStampView(generic.DeleteView):
    model = NewStampOfApproval

    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            pk = self.object.pk
            self.object.delete()
            ei = self.object.object
            now_current_stamp = EditorItem.objects.get(pk=ei.pk).current_stamp
            data = stamp_json(now_current_stamp) if now_current_stamp else None
            return http.HttpResponse(json.dumps({'current_stamp':data}),content_type='application/json')
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

class ShareLinkView(generic.RedirectView):
    permanent = False

    def get_redirect_url(self, *args,**kwargs):
        access = kwargs['access']
        try:
            if access == 'edit':
                q = self.model.objects.get(editoritem__share_uuid_edit=kwargs['share_uuid'])
            elif access == 'view':
                q = self.model.objects.get(editoritem__share_uuid_view=kwargs['share_uuid'])
        except (ValueError,self.model.DoesNotExist):
            raise Http404

        user = self.request.user
        if access=='view':
            has_access = q.editoritem.can_be_viewed_by(user)
        elif access=='edit':
            has_access = q.editoritem.can_be_edited_by(user)
            
        if not has_access:
            try:
                ea = Access.objects.get(item=q.editoritem,user=user)
            except Access.DoesNotExist:
                ea = Access(item=q.editoritem, user=user,access=access)
            ea.access = access
            ea.save()

        return q.get_absolute_url()
