import django_tables2 as tables
from django_tables2.columns import Column
from .models import EditorItem

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
