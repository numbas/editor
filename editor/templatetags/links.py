from django import template

register = template.Library()

@register.inclusion_tag('links/question.html')
def question_link(q):
    return {'q': q}

@register.inclusion_tag('links/exam.html')
def exam_link(e):
    return {'e': e}
