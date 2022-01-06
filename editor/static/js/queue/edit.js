function ViewModel(data) {
    var vm = this;
    this.checklist_items = ko.observableArray([]);
    this.add_checklist_item = function(i) {
        var item = new ChecklistItem(vm.checklist_items);
        if(i===undefined) {
            vm.checklist_items.push(item);
        } else {
            vm.checklist_items.splice(i,0,item);
        }
        return item;
    }

    data.forEach(function(d) {
        var i = vm.add_checklist_item();
        i.load(d);
    });
    if(!this.checklist_items().length) {
       this.add_checklist_item();
    }

    ko.computed(function() {
        var empty = vm.checklist_items().find(function(item) { return item.empty(); });
        if(!empty) {
            var item =vm.add_checklist_item();
            item.label();
        }
    },this);
}

function ChecklistItem(list) {
    var item = this;
    this.list = list;
    this.pk = null;
    this.label = ko.observable('');
    this.remove = function() {
        if(this.pk!==null) {
            if(!confirm("Are you sure you want to delete this checklist item? It will be removed from all existing queue entries.")) {
                return;
            }
        }
        list.remove(item);
    }
    this.empty = ko.computed(function() {
        return this.label().trim()=='';
    },this);
    this.add_item_after = function() {
        var index = item.list.indexOf(item);
        vm.add_checklist_item(index+1);
    }
}
ChecklistItem.prototype = {
    load: function(data){ 
        this.pk = data.pk;
        this.label(data.label);
    }
};

var vm;
$(document).ready(function() {
    var checklist_items_json_element = document.getElementById('checklist-items');
    var checklist_items_json = checklist_items_json_element ? JSON.parse(checklist_items_json_element.textContent) : [];
    vm = new ViewModel(checklist_items_json);
    ko.applyBindings(vm);
});
