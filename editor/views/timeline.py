from editor.views.generic import user_json,stamp_json,comment_json
from editor.views.version import version_json

event_json_views = {
    'version': version_json,
    'stamp': stamp_json,
    'comment': comment_json,
}

def event_json(event,viewed_by):
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

def timeline_json(events,viewed_by):
    return [event_json(event,viewed_by) for event in events]
