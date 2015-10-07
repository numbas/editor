from django.template import Library
from django.template.loader import render_to_string
from django.utils.safestring import mark_safe
register = Library()

@register.simple_tag
def list_through_template(template_name,tree,current):
    obj,children = tree
    out = render_to_string(template_name,{'object':obj,'current':current})
    if len(children):
        out += '\n<ul>\n{}\n</ul>'.format('\n'.join(list_through_template(template_name,child,current) for child in children))
    return mark_safe(out)

