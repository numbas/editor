from django.contrib.auth.mixins import UserPassesTestMixin
from django.views import generic
from django.urls import reverse, reverse_lazy
from django.shortcuts import redirect, render

from editor.models import SiteBroadcast
import editor.forms

class CreateView(UserPassesTestMixin, generic.CreateView):
    model = editor.forms.SiteBroadcastForm
    template_name = 'site_broadcast/create.html'
    form_class = editor.forms.SiteBroadcastForm
    success_url = reverse_lazy('editor_index')

    def test_func(self):
        return self.request.user.is_superuser
    
    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)
