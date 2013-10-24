from accounts.forms import NumbasRegistrationForm
from registration.views import register as original_register
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

def register(*args,**kwargs):
    kwargs['form_class'] = NumbasRegistrationForm
    return original_register(*args,**kwargs)

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
