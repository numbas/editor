import json
from editor.views.generic import user_json, stamp_json, comment_json
from editor.models import TimelineItem
from django.views import generic
from django import http
from django.urls import reverse

event_json_views = {
    'stamp': stamp_json,
    'comment': comment_json,
}

def event_json(event, viewed_by):
    date = event.date.strftime('%Y-%m-%d %H:%M:%S')
    user = user_json(event.user)

    if event.type not in event_json_views:
        raise Exception("Unrecognised event type %s" % event.type)

    data = event_json_views[event.type](event.data, viewed_by=viewed_by)

    return {
        'date': date,
        'type': event.type,
        'data': data,
        'user': user,
    }

def timeline_json(events, viewed_by):
    return [event_json(event, viewed_by) for event in events]

class DeleteTimelineItemView(generic.DeleteView):
    model = TimelineItem

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        if self.object.can_be_deleted_by(self.request.user):
            self.object.delete()
            return http.HttpResponse('timeline item {} deleted'.format(self.object.pk))
        else:
            return http.HttpResponseForbidden('You don\'t have the necessary access rights.')

class HideTimelineItemView(generic.UpdateView):
    model = TimelineItem
    fields = []
    http_method_names = ['post', 'head', 'options', 'trace']

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.hidden_by.add(self.request.user)
        data = {
            'success': True,
            'undo': reverse('timelineitem_unhide', args=(self.object.pk,))
        }
        return http.HttpResponse(json.dumps(data), content_type='application/json')

class UnhideTimelineItemView(generic.UpdateView):
    model = TimelineItem

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.hidden_by.remove(self.request.user)
        data = {
            'success': True,
        }
        return http.HttpResponse(json.dumps(data), content_type='application/json')
