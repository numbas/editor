from zipfile import ZipFile
import json

try:
    from cStringIO import StringIO
except ImportError:
    from io import StringIO

from django import apps
from django.conf import settings
from django.views.generic import UpdateView, DetailView, ListView, TemplateView
from django.views.generic.base import RedirectView
from django.contrib.auth.models import User
from django.core import signing
from django.shortcuts import redirect, render
from django.urls import reverse
from django.contrib import messages
from django.http import Http404, HttpResponse
from editor.slugify import slugify
from django.template.loader import get_template
from django.contrib.sites.shortcuts import get_current_site
from editor.models import NewQuestion, NewExam, Theme, Extension
import editor.models
from editor.views import editoritem, export
from registration import signals
import registration.views

from .forms import NumbasRegistrationForm, DeactivateUserForm, ReassignContentForm
from .forms import UserProfileForm, ChangePasswordForm
from .models import RegistrationProfile
from .util import find_users, user_json
from .email import unsubscribe_unsign

class RegistrationView(registration.views.RegistrationView):
    form_class = NumbasRegistrationForm

    def register(self, form, *args, **kwargs):
        d = form.cleaned_data
        username, email, password = d['username'], d['email'], d['password1']
        first_name, last_name = d['first_name'], d['last_name']
        site = get_current_site(self.request)
        new_user = RegistrationProfile.objects.create_inactive_user(username, first_name, last_name, email,
                                                                    password, site)
        signals.user_registered.send(sender=self.__class__,
                                     user=new_user,
                                     request=self.request,
                                     subscribe=form.cleaned_data.get('subscribe')
                                     )
        return new_user

    def get_success_url(self, *args, **kwargs):
        return reverse('registration_complete')

    def registration_allowed(self):
        return settings.ALLOW_REGISTRATION

class RegistrationCompleteView(TemplateView):
    template_name='registration/registration_complete.html'

    def get(self, request, *args, **kwargs):
        if not self.request.user.is_anonymous:
            return redirect(reverse('editor_index'))
        return super().get(request,*args,**kwargs)


class ActivationView(registration.views.ActivationView):
    template_name = 'registration/activation_complete.html'

    def activate(self, activation_key):
        activated_user = RegistrationProfile.objects.activate_user(activation_key, get_current_site(self.request))
        if activated_user:
            signals.user_activated.send(sender=self.__class__,
                                        user=activated_user,
                                        request=self.request)
        return activated_user
    def get_success_url(self, user):
        return ('registration_activation_complete', (), {})

class CurrentUserUpdateView(UpdateView):
    model = User

    def get_object(self, queryset=None):
        return self.request.user

class UserUpdateView(CurrentUserUpdateView):
    template_name = 'registration/update.html'

    form_class = UserProfileForm

    def get_context_data(self, *args, **kwargs):
        context = super(UserUpdateView, self).get_context_data(*args, **kwargs)
        context['profile_page'] = 'bio'
        context['view_user'] = self.get_object()
        context['mailing_list_active'] = apps.registry.apps.is_installed('numbasmailing')
        context['email_active'] = getattr(settings,'EMAIL_ABOUT_NOTIFICATIONS',False)
        if context['mailing_list_active']:
            context['unsubscribe_url'] = settings.MAILCHIMP.get('UNSUBSCRIBE_URL')
        return context

    def form_valid(self, form):
        messages.success(self.request, 'Your profile has been updated.')
        return super(UserUpdateView, self).form_valid(form)

    def get_success_url(self):
        user = self.get_object()
        return reverse('view_profile', args=(user.pk,))

class WellKnownChangePasswordView(RedirectView):
    permanent = True
    pattern_name = 'change_password'

class ChangePasswordView(CurrentUserUpdateView):
    template_name = 'registration/change_password.html'

    form_class = ChangePasswordForm

    def form_valid(self, form):
        messages.success(self.request, 'Your password has been changed.')
        return super(ChangePasswordView, self).form_valid(form)

    def get_success_url(self):
        return reverse('edit_profile')

class UserProfileView(DetailView):

    template_name = 'profile/view.html'

    model = User
    context_object_name = 'view_user'
    profile_page = 'bio'

    def get_context_data(self, *args, **kwargs):
        context = super(UserProfileView, self).get_context_data(*args, **kwargs)
        context['is_me'] = self.request.user == self.object
        context['profile_page'] = self.profile_page
        return context

class UserProjectsView(UserProfileView):
    template_name = 'profile/projects.html'
    profile_page = 'projects'

    def get_context_data(self, *args, **kwargs):
        context = super(UserProjectsView, self).get_context_data(*args, **kwargs)
        context['projects'] = [p for p in self.object.userprofile.projects().distinct() if p.can_be_viewed_by(self.request.user)]

        return context

class UserThemesView(UserProfileView):
    template_name = 'profile/themes.html'
    profile_page = 'themes'

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['given_access_themes'] = Theme.objects.filter(access__user=self.object).exclude(pk__in=self.object.own_themes.all())

        return context

class UserExtensionsView(UserProfileView):
    template_name = 'profile/extensions.html'
    profile_page = 'extensions'

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['given_access_extensions'] = Extension.objects.filter(access__user=self.object).exclude(pk__in=self.object.own_extensions.all())

        return context

class UserCustomPartTypesView(UserProfileView):
    template_name = 'profile/custom_part_types.html'
    profile_page = 'custom_part_types'

class ZipView(DetailView):
    def get(self, request, *args, **kwargs):
        files, filename = self.get_zip(request, *args, **kwargs)

        f = StringIO()
        z = ZipFile(f, 'w')

        for fname, fbytes in files:
            z.writestr(fname, fbytes)

        z.close()

        rf = f.getvalue()

        response = HttpResponse(rf, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=%s' % filename
        response['Content-Length'] = len(rf)
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response

class BackupView(export.UserProfileExportView):
    pass

class AllExamsView(ZipView):
    def get_zip(self, request, *args, **kwargs):
        user = request.user
        exams = NewExam.objects.filter(author=user)
        files = [('%s.exam' % e.slug, e.as_source()) for e in exams]

        return files, '%s-exams.zip' % slugify(user.get_full_name())

class AllQuestionsView(ZipView):
    def get_zip(self, request, *args, **kwargs):
        user = request.user
        questions = NewQuestion.objects.filter(author=user)

        files = [('%s.exam' % q.slug, q.as_source()) for q in questions]

        return files, '%s-questions.zip' % slugify(user.get_full_name())

class UserSearchView(ListView):
    
    """Search users."""
    
    model = User
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.accepts('application/json'):
            return HttpResponse(json.dumps(context['object_list']),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        try:
            search_term = self.request.GET['q']
            users = find_users(name=search_term)[:5]
        except KeyError:
            users = User.objects.filter(is_active=True)
        return [user_json(u) for u in users]

class AfterFirstLoginView(TemplateView):
    template_name = 'registration/after_first_login.html'
    def get_context_data(self, *args, **kwargs):
        context = super(AfterFirstLoginView, self).get_context_data(*args, **kwargs)
        context['invitations'] = editor.models.ProjectInvitation.objects.filter(email=self.request.user.email)
        return context

class UserEditorItemSearchView(editoritem.SearchView):
    template_name = 'profile/editoritem_search.html'

    def dispatch(self, request, pk, *args, **kwargs):
        self.user = User.objects.get(pk=pk)
        return super(UserEditorItemSearchView, self).dispatch(request, pk, *args, **kwargs)

    def base_queryset(self):
        return self.user.own_items.all()

    def get_context_data(self, *args, **kwargs):
        context = super(UserEditorItemSearchView, self).get_context_data(*args, **kwargs)
        context['view_user'] = self.user
        return context

class DeactivateUserView(CurrentUserUpdateView):
    model = User
    template_name = 'profile/deactivate.html'
    form_class = DeactivateUserForm

    def get_context_data(self, *args, **kwargs):
        context = super(DeactivateUserView, self).get_context_data(*args, **kwargs)
        context['mailing_list_active'] = apps.registry.apps.is_installed('numbasmailing')
        return context

    def get_success_url(self):
        return reverse('logout')

class ReassignContentView(CurrentUserUpdateView):
    model = User
    template_name = 'profile/reassign_content.html'
    form_class = ReassignContentForm

    def form_valid(self,form):
        res = super().form_valid(form)
        template = get_template('profile/content-reassigned.html')
        message= template.render({'to_user': form.cleaned_data['to_user']})
        messages.success(self.request, message)
        return res

    def get_success_url(self):
        return reverse('editor_index')

def unsubscribe_emails(request):
    token = request.GET.get('token',None)
    if token is None:
        return Http404()

    try:
        username = unsubscribe_unsign(token)
    except signing.BadSignature:
        return Http404()

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Http404()

    up = user.userprofile
    up.never_email = True
    up.save()
    
    return render(request, 'unsubscribed-emails.html',{})
