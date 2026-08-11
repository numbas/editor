from django import template
from django.urls import reverse
from django.utils.safestring import mark_safe
import json

register = template.Library()

icon_map = {
    'question': '📄',
    'exam': '📔',
    'project': '🏗',
    'explore': '🧭',
    'plus': '＋',
    'add': '＋',
    'upload': '🖅',
    'download': '📩',
    'notification': '🔔',
    'basket': '🛒',
    'home': '🏠',
    'profile': '👤',
    'settings': '⚙️',
    'admin': '🏰',
    'logout': '🚪',
    'eye-open': '👁️',
    'help': '📖',
    'helplink': '🯄',
    'tip': '👉',
    'copy': '📋',
    'remove': '🗑',
    'list': '🗉',
    'play': '▶',
    'danger': '⚠',
    'ok': '✔',
    'correct': '✔',
    'incorrect': '✘',
    'screen': '🖵',
    'text': '🖹',
    'feedback': '🗩',
    'pencil': '✎',
    'check': '☑',
    'computer': '💻',
    'adaptive': '🔀',
    'restriction': '⛓',
    'accuracy': '◎',
    'package': '📦',
    'file': '🗏',
    'transfer': '⤏',
    'next': '→',
    'from': '←',
    'to': '→',
    'scale': '⚖️',
    'grid': '▩',
    'regenerate': '⟳',
    'close': '❌',
    'undo': '↶',
    'redo': '↷',
    'random': '🎲',
    'advice': '🕮',
    'extension': '🔧',
}

@register.inclusion_tag('icon.html')
def icon(kind):
    return {'icon': icon_map.get(kind, kind),}

@register.simple_tag
def icon_map_json():
    return mark_safe(json.dumps(icon_map))
