from accounts.forms import NumbasRegistrationForm
import registration.views
from django.conf import settings
from django.views.generic import UpdateView, DetailView, ListView, TemplateView
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.http import Http404, HttpResponse
from django.template.defaultfilters import slugify
from accounts.forms import UserProfileForm,ChangePasswordForm
from editor.models import NewQuestion, NewExam
import editor.models
from editor.views import editoritem
from zipfile import ZipFile
from cStringIO import StringIO
from django.contrib.sites.models import Site
from accounts.models import RegistrationProfile
from registration import signals
from accounts.util import find_users, user_json
import json

class RegistrationView(registration.views.RegistrationView):
    form_class = NumbasRegistrationForm

    def register(self,form,*args,**kwargs):
        d = form.cleaned_data
        username, email, password = d['username'], d['email'], d['password1']
        first_name, last_name = d['first_name'], d['last_name']
        if Site._meta.installed:
            site = Site.objects.get_current()
        else:
            site = RequestSite(self.request)
        new_user = RegistrationProfile.objects.create_inactive_user(username, first_name, last_name, email,
                                                                    password, site)
        signals.user_registered.send(sender=self.__class__,
                                     user=new_user,
                                     request=self.request,
                                     subscribe=form.cleaned_data.get('subscribe')
                                     )
        return new_user

    def get_success_url(self,*args,**kwargs):
        return reverse('registration_complete')

    def registration_allowed(self):
        return settings.ALLOW_REGISTRATION

class ActivationView(registration.views.ActivationView):
    template_name = 'registration/activation_complete.html'

    def activate(self,activation_key):
        activated_user = RegistrationProfile.objects.activate_user(activation_key)
        if activated_user:
            signals.user_activated.send(sender=self.__class__,
                                        user=activated_user,
                                        request=self.request)
        return activated_user
    def get_success_url(self, user):
        return ('registration_activation_complete', (), {})

class CurrentUserUpdateView(UpdateView):
    model = User

    def get_object(self,queryset=None):
        return self.request.user

class UserUpdateView(CurrentUserUpdateView):
    template_name = 'registration/update.html'

    form_class = UserProfileForm

    def form_valid(self,form):
        messages.success(self.request,'Your profile has been updated.')
        return super(UserUpdateView,self).form_valid(form)

    def get_success_url(self):
        user = self.get_object()
        return reverse('view_profile',args=(user.pk,))

class ChangePasswordView(CurrentUserUpdateView):
    template_name = 'registration/change_password.html'

    form_class = ChangePasswordForm

    def get_object(self,queryset=None):
        return self.request.user
    
    def form_valid(self,form):
        messages.success(self.request,'Your password has been changed.')
        return super(ChangePasswordView,self).form_valid(form)

    def get_success_url(self):
        return reverse('edit_profile')

class UserProfileView(DetailView):

    template_name = 'profile/view.html'

    model = User
    context_object_name = 'view_user'
    profile_page = 'bio'

    def get_context_data(self,*args,**kwargs):
        context = super(UserProfileView,self).get_context_data(*args,**kwargs)
        context['is_me'] = self.request.user == self.object
        context['profile_page'] = self.profile_page
        return context

class UserTimelineView(UserProfileView):
    template_name = 'profile/timeline.html'
    profile_page = 'activity'

class UserProjectsView(UserProfileView):
    template_name = 'profile/projects.html'
    profile_page = 'projects'

    def get_context_data(self,*args,**kwargs):
        context = super(UserProjectsView,self).get_context_data(*args,**kwargs)
        context['projects'] = [p for p in self.object.userprofile.projects() if p.can_be_viewed_by(self.request.user)]

        return context

class UserThemesView(UserProfileView):
    template_name = 'profile/themes.html'
    profile_page = 'themes'

class UserExtensionsView(UserProfileView):
    template_name = 'profile/extensions.html'
    profile_page = 'extensions'

class ZipView(DetailView):
    def get(self,request,*args,**kwargs):
        files, filename = self.get_zip(request,*args,**kwargs)

        f = StringIO()
        z = ZipFile(f,'w')

        for fname,fbytes in files:
            z.writestr(fname,fbytes)

        z.close()

        rf = f.getvalue()

        response = HttpResponse(rf, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=%s' % filename
        response['Content-Length'] = len(rf)
        response['Cache-Control'] = 'max-age=0,no-cache,no-store'
        return response

class AllExamsView(ZipView):
    def get_zip(self,request,*args,**kwargs):
        user = request.user
        exams = NewExam.objects.filter(author=user)
        files = [('%s.exam' % e.slug, e.as_source()) for e in exams]

        return files, '%s-exams.zip' % slugify(user.get_full_name())

class AllQuestionsView(ZipView):
    def get_zip(self,request,*args,**kwargs):
        user = request.user
        questions = NewQuestion.objects.filter(author=user)

        files = [('%s.exam' % q.slug, q.as_source()) for q in questions]

        return files, '%s-questions.zip' % slugify(user.get_full_name())

class UserSearchView(ListView):
    
    """Search users."""
    
    model=User
    
    def render_to_response(self, context, **response_kwargs):
        if self.request.is_ajax():
            return HttpResponse(json.dumps(context['object_list']),
                                content_type='application/json',
                                **response_kwargs)
        raise Http404
    
    def get_queryset(self):
        try:
            search_term = self.request.GET['q']
            users = find_users(name=search_term)[:5]
        except KeyError:
            users = User.objects.all()
        return [user_json(u) for u in users]

class AfterFirstLoginView(TemplateView):
    template_name='registration/after_first_login.html'
    def get_context_data(self,*args,**kwargs):
        context = super(AfterFirstLoginView,self).get_context_data(*args,**kwargs)
        context['invitations'] = editor.models.ProjectInvitation.objects.filter(email=self.request.user.email)
        return context

class UserEditorItemSearchView(editoritem.SearchView):
    template_name = 'profile/editoritem_search.html'

    def dispatch(self,request,pk,*args,**kwargs):
        self.user = User.objects.get(pk=pk)
        return super(UserEditorItemSearchView,self).dispatch(request,pk,*args,**kwargs)

    def base_queryset(self):
        return self.user.own_items.all()

    def get_context_data(self,*args,**kwargs):
        context = super(UserEditorItemSearchView,self).get_context_data(*args,**kwargs)
        context['view_user'] = self.user
        return context
