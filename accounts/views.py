from accounts.forms import NumbasRegistrationForm
from registration.views import register as original_register
from django.views.generic import UpdateView
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from accounts.forms import UserProfileForm

def register(*args,**kwargs):
    kwargs['form_class'] = NumbasRegistrationForm
    return original_register(*args,**kwargs)

class UserUpdateView(UpdateView):
	model = User

	template_name = 'registration/update.html'

	form_class = UserProfileForm

	def form_valid(self,*args,**kwargs):
		print('User:',self.object)
		print(self.object.username)
		return super(UserUpdateView,self).form_valid(*args,**kwargs)

	def get_object(self,queryset=None):
		return self.request.user
	
	def get_success_url(self):
		return reverse('edit_profile')

