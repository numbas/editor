# from https://github.com/bradjasper/django-jsonfield/blob/master/jsonfield/fields.py (MIT licensed)

import json
from django.db import models
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.translation import gettext_lazy as _

from django.forms.fields import CharField
from django.forms.utils import ValidationError as FormValidationError
from django.forms.widgets import Textarea

try:
    basestring = unicode
except NameError:
    basestring = str

try:
    from south.modelsinspector import add_introspection_rules
except ImportError:
    pass

class JSONWidget(Textarea):
    def render(self, name, value, attrs=None):
        value = json.dumps(value, indent=4)
        return super(JSONWidget,self).render(name,value,attrs)

class JSONFormField(CharField):
    widget = JSONWidget

    def clean(self, value):
        if not value and not self.required:
            return None

        value = super(JSONFormField, self).clean(value)

        if isinstance(value, basestring):
            try:
                json.loads(value)
            except ValueError:
                raise FormValidationError(_("Enter valid JSON"))
        return value

def load_json(value, load_kwargs):
    """Convert string value to JSON"""
    if isinstance(value, basestring):
        try:
            return json.loads(value, **load_kwargs)
        except ValueError:
            pass
    return value

class JSONField(models.TextField):
    """JSONField is a generic textfield that serializes/unserializes JSON objects"""

    def __init__(self, *args, **kwargs):
        self.dump_kwargs = kwargs.pop('dump_kwargs', {'cls': DjangoJSONEncoder})
        self.load_kwargs = kwargs.pop('load_kwargs', {})

        super(JSONField, self).__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        return load_json(value, self.load_kwargs)

    def to_python(self, value):
        return load_json(value, self.load_kwargs)

    def get_db_prep_value(self, value, connection, prepared=False):
        """Convert JSON object to a string"""
        
        if isinstance(value, basestring):
            return value
        return json.dumps(value, **self.dump_kwargs)

    def value_to_string(self, obj):
        value = self.value_from_object(obj)
        return self.get_prep_value(value)


    def formfield(self, **kwargs):

        if "form_class" not in kwargs:
            kwargs["form_class"] = JSONFormField

        field = super(JSONField, self).formfield(**kwargs)

        if not field.help_text:
            field.help_text = "Enter valid JSON"

        return field

try:
    add_introspection_rules([], [r"^editor\.jsonfield\.JSONField"])
except NameError:
    pass
