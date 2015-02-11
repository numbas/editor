#Copyright 2012 Newcastle University
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
from django.contrib import admin
from django.db.models import Count
from django.contrib.auth.admin import UserAdmin

import editor.models

admin.site.register(editor.models.Exam)
admin.site.register(editor.models.Question)
admin.site.register(editor.models.QuestionHighlight)
admin.site.register(editor.models.Extension)
admin.site.register(editor.models.Theme)

# allow users to be sorted by date joined
UserAdmin.list_display += ('date_joined',)
UserAdmin.list_filter += ('date_joined',)

class LicenceAdmin(admin.ModelAdmin):
    list_display = ['name','short_name','can_reuse','can_modify','can_sell']

admin.site.register(editor.models.Licence,LicenceAdmin)

class EditorTagAdmin(admin.ModelAdmin):
    list_display = ['name','show_used_count','official']
    actions = ['make_tag_official','merge_tags']

    def get_queryset(self,request):
        return editor.models.EditorTag.objects.annotate(used_count=Count('tagged_items'))

    def show_used_count(self,instance):
        return instance.used_count
    show_used_count.admin_order_field = 'used_count'
    show_used_count.short_description = 'Times used'

    def make_tag_official(self,request,queryset):
        queryset.update(official=True)
    make_tag_official.short_description = 'Make official'

    def merge_tags(self,request,queryset):
        if len(queryset)==1:
            return

        tags = list(queryset)
        tags.sort(key=editor.models.EditorTag.used_count,reverse=True)
        merged_tag = tags[0]

        TaggedQuestion.objects.filter(tag__in=tags[1:]).update(tag=merged_tag)

        if queryset.filter(official=True).exists():
            merged_tag.official = True
            merged_tag.save()

        queryset.exclude(pk=merged_tag.pk).delete()

        self.message_user(request,"Tags %s merged into '%s'" % (', '.join("'%s'" % t.name for t in tags),merged_tag.name))
    merge_tags.short_description = 'Merge tags'

admin.site.register(editor.models.EditorTag,EditorTagAdmin)
