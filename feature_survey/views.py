from django.contrib.auth.mixins import UserPassesTestMixin
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import render
from django.views import generic
from django.db.models import Count
from itertools import groupby

from .models import Feature

# Create your views here.

class MustBeSuperuserMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_superuser

class FeaturesView(MustBeSuperuserMixin,generic.ListView):
    model = Feature
    template_name = 'feature_survey/list.html'

    def get_context_data(self,*args,**kwargs):
        context = super().get_context_data(*args,**kwargs)

        counts = Feature.objects.all().values('object_content_type','feature').annotate(freq=Count('feature'))
        raw_groups = groupby(counts,key=lambda x: x['object_content_type'])
        context['groups'] = [(ContentType.objects.get(pk=ctid).name,list(features)) for ctid,features in raw_groups]

        context['features'] = sorted([d['feature'] for d in Feature.objects.all().values('feature').distinct()])

        return context

class FeatureView(MustBeSuperuserMixin,generic.ListView):
    model = Feature
    template_name = 'feature_survey/feature.html'

    def get_queryset(self):
        feature = self.request.GET.get('feature','')
        return Feature.objects.filter(feature=feature)

    def get_context_data(self,*args,**kwargs):
        context = super().get_context_data(*args,**kwargs)

        context['feature'] = self.request.GET.get('feature','')

        return context

