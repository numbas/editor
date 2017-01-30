from django.template import Library

register = Library()

@register.inclusion_tag('editor-controls/property.html', name='property', takes_context=True)
def property_tag(context, property_name, label, *args, **kwargs):
    context.update({
        'property': property_name,
        'label': label,
        'dynamic_label': kwargs.get('dynamic_label', False),
        'monospace': kwargs.get('monospace', False),
        'type': kwargs.get('type', 'text'),
        'help_url': kwargs.get('help_url'),
        'disable': kwargs.get('disable', 'false'),
        'min': kwargs.get('min'),
        'max': kwargs.get('max'),
        'form_label_class': context.get('form_label_class', 'col-sm-3'),
        'form_control_class': context.get('form_control_class', 'col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/percentproperty.html', takes_context=True)
def percentproperty(context, property_name, label, *args, **kwargs):
    context.update({
        'property': property_name,
        'label': label,
        'help_url': kwargs.get('help_url'),
        'disable': kwargs.get('disable', 'false'),
        'form_label_class': context.get('form_label_class', 'col-sm-3'),
        'form_control_class': context.get('form_control_class', 'col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/selectproperty.html', takes_context=True)
def selectproperty(context, property_name, label, *args, **kwargs):
    context.update({
        'property': property_name,
        'label': label,
        'options': kwargs.get('options'),
        'options_text': kwargs.get('options_text'),
        'help_url': kwargs.get('help_url'),
        'disable': kwargs.get('disable', 'false'),
        'form_label_class': context.get('form_label_class', 'col-sm-3'),
        'form_control_class': context.get('form_control_class', 'col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/booleanproperty.html', takes_context=True)
def booleanproperty(context, property_name, label, *args, **kwargs):
    context.update({
        'property': property_name,
        'label': label,
        'help_url': kwargs.get('help_url'),
        'disable': kwargs.get('disable', 'false'),
        'form_label_class': context.get('form_label_class', 'col-sm-3'),
        'form_control_class': context.get('form_control_class', 'col-sm-9'),
    })
    return context

@register.inclusion_tag('editor-controls/exam_event.html', takes_context=True)
def exam_event(context, property_name, name, *args, **kwargs):
    context.update({
        'property': property_name,
        'name': name,
        'help_url': kwargs.get('help_url'),
        'disable': kwargs.get('disable', 'false'),
        'form_label_class': context.get('form_label_class', 'col-sm-3'),
        'form_control_class': context.get('form_control_class', 'col-sm-9'),
    })
    return context
