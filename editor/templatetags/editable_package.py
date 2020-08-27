from django.template import Library

register = Library()

from django.template.base import kwarg_re
from django.utils.html import conditional_escape
from django.template.defaulttags import URLNode

class PackageURLNode(URLNode):
    def render(self, context):
        from django.urls import NoReverseMatch, reverse
        args = [arg.resolve(context) for arg in self.args]
        kwargs = {k: v.resolve(context) for k, v in self.kwargs.items()}
        view_name = context['object'].package_noun+'_'+self.view_name.resolve(context)
        try:
            current_app = context.request.current_app
        except AttributeError:
            try:
                current_app = context.request.resolver_match.namespace
            except AttributeError:
                current_app = None
        # Try to look up the URL. If it fails, raise NoReverseMatch unless the
        # {% url ... as var %} construct is used, in which case return nothing.
        url = ''
        try:
            url = reverse(view_name, args=args, kwargs=kwargs, current_app=current_app)
        except NoReverseMatch:
            if self.asvar is None:
                raise

        if self.asvar:
            context[self.asvar] = url
            return ''
        else:
            if context.autoescape:
                url = conditional_escape(url)
            return url

@register.tag
def package_url(parser, token):
    r"""
    Return an absolute URL matching the given view with its parameters.
    This is a way to define links that aren't tied to a particular URL
    configuration::
        {% url "url_name" arg1 arg2 %}
        or
        {% url "url_name" name1=value1 name2=value2 %}
    The first argument is a URL pattern name. Other arguments are
    space-separated values that will be filled in place of positional and
    keyword arguments in the URL. Don't mix positional and keyword arguments.
    All arguments for the URL must be present.
    For example, if you have a view ``app_name.views.client_details`` taking
    the client's id and the corresponding line in a URLconf looks like this::
        path('client/<int:id>/', views.client_details, name='client-detail-view')
    and this app's URLconf is included into the project's URLconf under some
    path::
        path('clients/', include('app_name.urls'))
    then in a template you can create a link for a certain client like this::
        {% url "client-detail-view" client.id %}
    The URL will look like ``/clients/client/123/``.
    The first argument may also be the name of a template variable that will be
    evaluated to obtain the view name or the URL name, e.g.::
        {% with url_name="client-detail-view" %}
        {% url url_name client.id %}
        {% endwith %}
    """
    bits = token.split_contents()
    if len(bits) < 2:
        raise TemplateSyntaxError("'%s' takes at least one argument, a URL pattern name." % bits[0])
    viewname = parser.compile_filter(bits[1])
    args = []
    kwargs = {}
    asvar = None
    bits = bits[2:]
    if len(bits) >= 2 and bits[-2] == 'as':
        asvar = bits[-1]
        bits = bits[:-2]

    for bit in bits:
        match = kwarg_re.match(bit)
        if not match:
            raise TemplateSyntaxError("Malformed arguments to url tag")
        name, value = match.groups()
        if name:
            kwargs[name] = parser.compile_filter(value)
        else:
            args.append(parser.compile_filter(value))

    return PackageURLNode(viewname, args, kwargs, asvar)
