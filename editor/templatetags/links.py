from django import template

register = template.Library()

@register.inclusion_tag('links/question.html')
def question_link(q):
    return {'q': q}
