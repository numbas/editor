#Copyright 2012 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
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

from editor.models import Extension,NewStampOfApproval,NewComment,TimelineItem

# from http://stackoverflow.com/questions/18172102/object-ownership-validation-in-django-updateview
class AuthorRequiredMixin(object):
    def dispatch(self, request, *args, **kwargs):
        result = super(AuthorRequiredMixin, self).dispatch(request, *args, **kwargs)
        if self.object.author != self.request.user:
            template = get_template("403.html")
            return http.HttpResponseForbidden(template.render(RequestContext(self.request)))
        return result

class TimelineItemViewMixin(object):
    def response(self,object):
        return render_to_response(object.timelineitem_template,RequestContext(self.request,{'item':object.timelineitem,'can_delete': object.can_be_deleted_by(self.request.user)}))

class StampView(generic.UpdateView,TimelineItemViewMixin):
    def post(self, request, *args, **kwargs):
        object = self.get_object()

        status = request.POST.get('status')

        stamp = NewStampOfApproval.objects.create(user=request.user,object=object.editoritem,status=status)

        return self.response(stamp)

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

class CommentView(generic.UpdateView,TimelineItemViewMixin):
    def post(self, request, *args, **kwargs):
        object = self.get_object()

        text = request.POST.get('text')

        comment = NewComment(user=request.user,object=object.editoritem,text=text)
        comment.save()

        return self.response(comment)

    def get(self, request, *args, **kwargs):
        return http.HttpResponseNotAllowed(['POST'],'GET requests are not allowed at this URL.')

def user_json(user):
    if user is None:
        return {
                'name': 'Anonymous',
                'pk': None
        }
    else:
        return {
                'name': user.get_full_name(),
                'pk': user.pk,
                'profile_url': reverse('view_profile',args=(user.pk,))
        }

# JSON representation of a editor.models.StampOfApproval object
def stamp_json(stamp,**kwargs):
    return {
        'pk': stamp.pk,
        'date': stamp.timelineitem.date.strftime('%Y-%m-%d %H:%M:%S'),
        'status': stamp.status,
        'status_display': stamp.get_status_display(),
        'user': user_json(stamp.user),
    }

# JSON representation of a editor.models.StampOfApproval object
def comment_json(comment,**kwargs):
    return {
        'pk': comment.pk,
        'date': comment.date.strftime('%Y-%m-%d %H:%M:%S'),
        'text': comment.text,
        'user': user_json(comment.user),
        'delete_url': reverse('delete_comment',args=(comment.pk,))
    }

class DeleteTimelineItemView(generic.DeleteView):
    model = TimelineItem

    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            self.object.delete()
            return http.HttpResponse('timeline item {} deleted'.format(self.object.pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

class DeleteCommentView(generic.DeleteView):
    model = NewComment
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            pk = self.object.pk
            self.object.delete()
            return http.HttpResponse('stamp {} deleted'.format(pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

class DeleteStampView(generic.DeleteView):
    model = NewStampOfApproval
    def delete(self,request,*args,**kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            pk = self.object.pk
            self.object.delete()
            return http.HttpResponse('stamp {} deleted'.format(pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')
