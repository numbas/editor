from editor.views.generic import user_json,stamp_json
from editor.views.version import version_json

def event_json(event,viewed_by):
    date = event.date.strftime('%Y-%m-%d %H:%M:%S')
    user = user_json(event.user)

    if event.type == 'version':
        data = version_json(event.data,viewed_by)
    elif event.type == 'stamp':
        data = stamp_json(event.data)

    return {
        'date': date,
        'type': event.type,
        'data': data,
        'user': user,
    }

def timeline_json(events,viewed_by):
    return [event_json(event,viewed_by) for event in events]
