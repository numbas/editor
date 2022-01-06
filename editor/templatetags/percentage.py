from django import template
from math import floor,isclose

register = template.Library()

@register.filter
def percentage(value,minimum="0"):
    minimum = float(minimum)/100
    percent = ((1-minimum)*value + minimum)*100
    percent = round(percent) if isclose(percent,round(percent)) else floor(percent)
    return "{0:.0%}".format(percent/100)

@register.filter
def percentage_bin(value,bins=3):
    if value==0:
        return 0
    elif value==1:
        return bins-1
    else:
        n = floor(value*(bins-2))+1
    return n
