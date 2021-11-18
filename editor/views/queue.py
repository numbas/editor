from django.shortcuts import redirect
from django.urls import reverse
from django.views import generic

from editor import forms
from editor.models import EditorItem, ItemQueue, Project, ItemQueueChecklistItem, ItemQueueEntry, ItemQueueChecklistTick
import editor.views.generic

class CreateView(generic.CreateView):
    model = ItemQueue
    form_class = forms.CreateItemQueueForm
    template_name = 'queue/new.html'

    def get_initial(self):
        data = self.initial.copy()
        data['owner'] = self.request.user
        if 'project' in self.request.GET:
            data['project'] = Project.objects.get(pk=int(self.request.GET['project']))
        else:
            data['project'] = self.request.user.userprofile.personal_project
        return data

    def form_valid(self, form):
        response = super().form_valid(form)
        for item in self.request.POST.getlist('checklist'):
            ItemQueueChecklistItem.objects.create(queue=self.object, label=item)
        return response

    def get_success_url(self):
        return reverse('queue_view', args=(self.object.pk,))

class DetailView(generic.DetailView):
    model = ItemQueue
    template_name = 'queue/view.html'
    context_object_name = 'queue'

class AddEntryView(generic.CreateView):
    model = ItemQueueEntry
    form_class = forms.CreateItemQueueEntryForm
    template_name = 'queue/add.html'

    def dispatch(self, *args, **kwargs):
        self.queue = ItemQueue.objects.get(pk=self.kwargs.get('pk'))
        return super().dispatch(*args, **kwargs)

    def get_given_item(self):
        if 'item' in self.request.GET:
            return EditorItem.objects.get(pk=int(self.request.GET['item']))

    def get_initial(self):
        data = self.initial.copy()
        given_item = self.get_given_item()
        if given_item:
            data['item'] = given_item
        data['created_by'] = self.request.user
        data['queue'] = self.queue
        return data

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        
        context['queue'] = self.queue
        context['given_item'] = self.get_given_item()

        context['json'] = {
            'recent_items': self.request.user.userprofile.recent_questions,
            'basket': self.request.user.userprofile.question_basket.all(),
        }

        return context

    def get_success_url(self):
        return reverse('queue_view', args=(self.queue.pk,))

class ReviewEntryView(generic.DetailView):
    model = ItemQueueEntry
    template_name = 'queue/review_entry.html'
    context_object_name = 'entry'

    def post(self, request, *args, **kwargs):
        entry = self.get_object()
        ticked_pks = [int(x) for x in self.request.POST.getlist('ticked-items')]
        to_delete = ItemQueueChecklistTick.objects.filter(entry=entry).exclude(item__pk__in=ticked_pks)
        to_delete.delete()
        to_add = entry.checklist_items().filter(ticked=False,pk__in=ticked_pks)
        for item in to_add:
            ItemQueueChecklistTick.objects.create(entry=entry, item=item, user=self.request.user)

        entry.complete = self.request.POST.get('remove') == 'on'
        entry.save()

        return redirect('queue_view', pk=entry.queue.pk)

class CommentView(editor.views.generic.CommentView):
    model = ItemQueueEntry
