import django_tables2 as tables
from django.db.models import Sum, When, Case, IntegerField, Count, Value, CharField
from django_tables2.columns import Column
from .models import EditorItem, Project

class ObjectTable(tables.Table):
    last_modified = Column()

    class Meta:
        attrs = {'class': 'search-results'}

        fields = ('name', 'current_stamp', 'licence', 'author')
        order_by = ('-last_modified')

    def render_last_modified(self, record):
        return record.last_modified.strftime('%d/%m/%Y %H:%M')

class EditorItemTable(ObjectTable):
    class Meta(ObjectTable.Meta):
        model = EditorItem
        sequence = ('name', 'current_stamp', 'licence', 'author', 'last_modified')

class BlankColumn(Column):
    is_blank = True

class CurrentStampColumn(Column):
    def order(self, queryset, is_descending):
        queryset = queryset.order_by(('-' if is_descending else '')+'current_stamp__status')
        return (queryset, True)

class EditorItemTypeColumn(Column):
    def order(self, queryset, is_descending):
        queryset = queryset.annotate(
            itemtype=Case(
                When(question__isnull=False, then=Value('question')),
                When(exam__isnull=False, then=Value('exam')),
                default=Value(''),
                output_field=CharField()
            )
        ).order_by(
            ('-' if is_descending else '')+'itemtype',
            'name'
        )
        return (queryset, True)

class BrowseProjectTable(ObjectTable):
    current_stamp = CurrentStampColumn(verbose_name='Status', initial_sort_descending=True)
    last_modified = Column(initial_sort_descending=True)
    play = BlankColumn()
    item_type = EditorItemTypeColumn(accessor='question',verbose_name='Type')
    class Meta(ObjectTable.Meta):
        model = EditorItem
        sequence = ('current_stamp', 'play', 'name', 'item_type', 'last_modified')
        fields = ('current_stamp', 'name', 'last_modified')

class RecentlyPublishedTable(tables.Table):
    class Meta(ObjectTable.Meta):
        model = EditorItem
        fields = ('published_date',)
        order_by = ('-published_date')

class NumItemsColumn(Column):
    def order(self, queryset, is_descending):
        queryset = queryset.annotate(num_items=Sum(Case(When(items__published=True,then=1),default=0,output_field=IntegerField()))).order_by(('-' if is_descending else '')+'num_items')
        return (queryset, True)

class ProjectTable(tables.Table):
    num_items = NumItemsColumn()

    class Meta:
        model = Project
        sequence = ('name','num_items')
