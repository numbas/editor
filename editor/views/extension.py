#Copyright 2014 Newcastle University
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

from django.views import generic
from django.core.urlresolvers import reverse

from editor.models import Extension
from editor.forms import NewExtensionForm, UpdateExtensionForm
from editor.views.generic import AuthorRequiredMixin

class CreateView(generic.CreateView):
    """ Create an extension """

    model = Extension
    form_class = NewExtensionForm
    template_name = 'extension/create.html'

    def get_form_kwargs(self):
        kwargs = super(CreateView,self).get_form_kwargs()
        kwargs['author'] = self.request.user
        return kwargs

    def get_success_url(self):
        return reverse('profile_extensions',args=(self.request.user.pk))

class UpdateView(AuthorRequiredMixin,generic.UpdateView):
	""" Edit an extension """

	model = Extension
	form_class = UpdateExtensionForm
	template_name = 'extension/edit.html'

	def get_success_url(self):
		return reverse('profile_extensions',args=(self.request.user.pk))

class DeleteView(AuthorRequiredMixin,generic.DeleteView):
    model = Extension
    template_name = 'extension/delete.html'

    def get_success_url(self):
        return reverse('profile_extensions',args=(self.request.user.pk))
