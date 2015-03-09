from accounts.forms import NumbasRegistrationForm
import registration.views
from django.conf import settings
from django.views.generic import UpdateView, DetailView
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.http import HttpResponse
from django.template.defaultfilters import slugify
from accounts.forms import UserProfileForm,ChangePasswordForm
from editor.models import Question, Exam
from zipfile import ZipFile
from cStringIO import StringIO
from django.contrib.sites.models import Site
from accounts.models import RegistrationProfile
from registration import signals

class RegistrationView(registration.views.RegistrationView):
    form_class = NumbasRegistrationForm

    def register(self,request,*args,**kwargs):
        username, email, password = kwargs['username'], kwargs['email'], kwargs['password1']
        first_name, last_name = kwargs['first_name'], kwargs['last_name']
        if Site._meta.installed:
            site = Site.objects.get_current()
        else:
            site = RequestSite(request)
        new_user = RegistrationProfile.objects.create_inactive_user(username, first_name, last_name, email,
                                                                    password, site)
        signals.user_registered.send(sender=self.__class__,
                                     user=new_user,
                                     request=request)
        return new_user

    def get_success_url(self,*args,**kwargs):
        return reverse('registration_complete')

    def registration_allowed(self, request):
        return settings.ALLOW_REGISTRATION

class ActivationView(registration.views.ActivationView):
    template_name = 'registration/activation_complete.html'

    def activate(self,request,activation_key):
        activated_user = RegistrationProfile.objects.activate_user(activation_key)
        if activated_user:
            signals.user_activated.send(sender=self.__class__,
                                        user=activated_user,
                                        request=request)
        return activated_user
    def get_success_url(self, request, user):
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
        return reverse('edit_profile')

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

    def get_context_data(self,*args,**kwargs):
        context = super(UserProfileView,self).get_context_data(*args,**kwargs)
        context['is_me'] = self.request.user == self.object
        return context

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
        exams = Exam.objects.filter(author=user)
        files = [('%s.exam' % e.slug, e.as_source()) for e in exams]

        return files, '%s-exams.zip' % slugify(user.get_full_name())

class AllQuestionsView(ZipView):
    def get_zip(self,request,*args,**kwargs):
        user = request.user
        questions = Question.objects.filter(author=user)

        files = [('%s.exam' % q.slug, q.as_source()) for q in questions]

        return files, '%s-questions.zip' % slugify(user.get_full_name())
