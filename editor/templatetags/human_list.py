from django.template import Library

register = Library()

def human_list(l):
	if len(l)==1:
		return l[0]
	else:
		return ', '.join(l[:-1])+' and '+l[-1]

register.filter('human_list', human_list)


