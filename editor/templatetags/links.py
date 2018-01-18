from django import template
from django.urls import reverse

register = template.Library()

@register.inclusion_tag('links/question.html')
def question_link(q):
    return {'q': q}

@register.inclusion_tag('links/exam.html')
def exam_link(e):
    return {'e': e}

@register.inclusion_tag('links/editoritem.html')
def editoritem_link(item):
    return {'item': item}

@register.simple_tag
def editoritem_url(link, item):
    return reverse('{}_{}'.format(item.editoritem.item_type, link), args=(item.pk, item.editoritem.slug))

@register.inclusion_tag('links/project.html')
def project_link(project):
    return {'project': project}
