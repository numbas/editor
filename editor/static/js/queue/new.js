function ViewModel() {
    var vm = this;
    this.checklist_items = ko.observableArray([]);
    this.add_checklist_item = function() {
        var item = new ChecklistItem(vm.checklist_items);
        vm.checklist_items.push(item);
        return item;
    }
    vm.add_checklist_item();
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
    this.label = ko.observable('');
    this.remove = function() {
        list.remove(item);
    }
    this.empty = ko.computed(function() {
        return this.label().trim()=='';
    },this);
}

var vm;
$(document).ready(function() {
    vm = new ViewModel();
    ko.applyBindings(vm);
});
