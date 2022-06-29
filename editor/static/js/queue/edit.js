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

    this.status_items = ko.observableArray([]);
    this.add_status_item = function(i) {
        var item = new StatusItem(vm.status_items);
        if(i===undefined) {
            vm.status_items.push(item);
        } else {
            vm.status_items.splice(i,0,item);
        }
        return item;
    }

    if(data) {
        data.checklist_items.forEach(function(d) {
            var i = vm.add_checklist_item();
            i.load(d);
        });
        data.statuses.forEach(function(d) {
            var i = vm.add_status_item();
            i.load(d);
        });
    }

    ko.computed(function() {
        var empty = vm.checklist_items().find(function(item) { return item.empty(); });
        if(!empty) {
            var item = vm.add_checklist_item();
            item.empty();
        }
    },this);

    ko.computed(function() {
        var empty = vm.status_items().find(function(item) { return item.empty(); });
        if(!empty) {
            var item = vm.add_status_item();
            item.empty();
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
    this.move_up = function() {
        var i = item.list.indexOf(item);
        if(i<=0) {
            return;
        }
        item.list.splice(i,1);
        item.list.splice(i-1,0,item);
    }
    this.move_down = function() {
        var i = item.list.indexOf(item);
        if(i==-1 || i>=item.list().length-1) {
            return;
        }
        item.list.splice(i,1);
        item.list.splice(i+1,0,item);
    }
    this.can_move_up = ko.computed(function() {
        var i = this.list.indexOf(this);
        return i>0 && i<this.list().length-1;
    },this);
    this.can_move_down = ko.computed(function() {
        return this.list.indexOf(this)<this.list().length-2;
    },this);

}
ChecklistItem.prototype = {
    load: function(data){ 
        this.pk = data.pk;
        this.label(data.label);
    }
};

function StatusItem(list) {
    var item = this;
    this.list = list;
    this.label = ko.observable('');
    this.remove = function() {
        if(this.pk!==null) {
            if(!confirm("Are you sure you want to delete this status?")) {
                return;
            }
        }
        list.remove(item);
    }
    this.empty = ko.computed(function() {
        return this.label().trim()=='';
    },this);
}
StatusItem.prototype = {
    load: function(data){ 
        this.label(data);
    }
};

var vm;
$(document).ready(function() {
    var data_json_element = document.getElementById('data');
    var data_json = data_json_element ? JSON.parse(data_json_element.textContent) : null;
    vm = new ViewModel(data_json);
    ko.applyBindings(vm);
});
