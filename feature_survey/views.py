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

        counts = Feature.objects.all().order_by('object_content_type','feature').values('object_content_type','feature').annotate(freq=Count('feature'))
        raw_groups = groupby(counts,key=lambda x: x['object_content_type'])
        context['groups'] = [(ContentType.objects.get(pk=ctid).name,list(sorted(features,key=lambda x: x['feature']))) for ctid,features in raw_groups]

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

class IntersectFeaturesView(MustBeSuperuserMixin,generic.TemplateView):
    template_name = 'feature_survey/intersection.html'

    def get_objects(self):
        features = self.features
        content_types = Feature.objects.filter(feature__in=features).values_list('object_content_type',flat=True).distinct()
        found = []
        for ct_pk in content_types:
            ct = ContentType.objects.get(pk=ct_pk)
            model = ct.model_class()
            objects = model.objects.all()

            for f in features:
                objects = objects.filter(pk__in=Feature.objects.filter(feature=f,object_content_type=ct).values('object_id'))

            found += objects
            
        self.objects = found
        return found

    def get_context_data(self,*args,**kwargs):
        context = super().get_context_data(*args,**kwargs)

        self.features = context['features'] = self.request.GET.getlist('features')

        context['objects'] = self.get_objects()

        return context

