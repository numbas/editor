import json
from django.core.serializers import serialize
from django.db.models.query import QuerySet
from django.template import Library

register = Library()

class EscapeScriptJSONEncoder(json.JSONEncoder):
    def encode(self, o):
        enc = super(EscapeScriptJSONEncoder,self).encode(o)
        return enc.replace('</script>',r'<\/script>')

def jsonify(obj):
    if isinstance(obj, QuerySet):
        return serialize('json', obj)
    return json.dumps(obj, cls=EscapeScriptJSONEncoder)

register.filter('jsonscript', jsonify)
register.filter('json', jsonify)
