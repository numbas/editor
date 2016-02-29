from django.template import Library
from django.template.loader import render_to_string

register = Library()

@register.inclusion_tag('editor-controls/property.html', takes_context=True)
def property(context,property,label,*args,**kwargs):
    context = context.update({
        'property': property,
        'label': label,
        'dynamic_label': kwargs.get('dynamic_label',False),
        'monospace': kwargs.get('monospace',False),
        'type': kwargs.get('type','text'),
        'help_url': kwargs.get('help_url'),
        'min': kwargs.get('min'),
        'max': kwargs.get('max'),
        'form_label_class': context.get('form_label_class','col-sm-3'),
        'form_control_class': context.get('form_control_class','col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/percentproperty.html', takes_context=True)
def percentproperty(context,property,label,*args,**kwargs):
    context = context.update({
        'property': property,
        'label': label,
        'help_url': kwargs.get('help_url'),
        'form_label_class': context.get('form_label_class','col-sm-3'),
        'form_control_class': context.get('form_control_class','col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/selectproperty.html', takes_context=True)
def selectproperty(context,property,label,*args,**kwargs):
    context = context.update({
        'property': property,
        'label': label,
        'options': kwargs.get('options'),
        'options_text': kwargs.get('options_text'),
        'help_url': kwargs.get('help_url'),
        'form_label_class': context.get('form_label_class','col-sm-3'),
        'form_control_class': context.get('form_control_class','col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/booleanproperty.html', takes_context=True)
def booleanproperty(context,property,label,*args,**kwargs):
    context = context.update({
        'property': property,
        'label': label,
        'help_url': kwargs.get('help_url'),
        'form_label_class': context.get('form_label_class','col-sm-3'),
        'form_control_class': context.get('form_control_class','col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/exam_event.html',takes_context=True)
def exam_event(context,property,name,*args,**kwargs):
    context = context.update({
        'property': property,
        'name': name,
        'help_url': kwargs.get('help_url'),
        'form_label_class': context.get('form_label_class','col-sm-3'),
        'form_control_class': context.get('form_control_class','col-sm-9'),
    })
    return context
