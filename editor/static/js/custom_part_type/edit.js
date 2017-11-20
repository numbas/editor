var viewModel;

$(document).ready(function() {
    var CustomPartType = Editor.custom_part_type.CustomPartType = function(data) {
        var pt = this;

        this.name = ko.observable('');
        this.short_name = ko.observable('');
        this.description = ko.observable('');

        this.tabs = [
            new Editor.Tab('description','Description','cog'),
            new Editor.Tab('input','Answer input','pencil'),
            new Editor.Tab('options','Part options','wrench'),
            new Editor.Tab('marking','Marking','check')
        ];
        this.getTab = function(id) {
            return pt.tabs().find(function(t){return t.id==id});
        }
        this.setTab = function(id) {
            return function() {
                var tab = p.getTab(id);
                p.currentTab(tab);
            }
        }

        this.currentTab = ko.observable(this.tabs[0]);

        this.input_type = ko.observable('');
        this.input_options = {
            correctAnswer: ko.observable(''),
            hint: ko.observable('')
        }

        this.can_be_gap = ko.observable(true);
        this.can_be_step = ko.observable(true);

        this.settings = ko.observableArray([]);

        this.marking_algorithm = ko.observable('');
        this.marking_notes = ko.observableArray([]);

        this.edit_name = function() {
            pt.setTab('description')();
        }
        
        if(data) {
            this.load(data);
        }
    }
    CustomPartType.prototype = {
        load: function(data) {
            var tryLoad = Editor.tryLoad;

            tryLoad(data,['name','short_name','description'],this);
        },

        toJSON: function() {
        }
    }

    var Setting = Editor.custom_part_type.Setting = function(data) {
        this.name = ko.observable('');
        this.label = ko.observable('');
        this.input_type = ko.observable('');
        this.default = ko.observable('');
        this.choices = ko.observableArray([]);
    }

    var Note = Editor.custom_part_type.Note = function(data) {
        this.name = ko.observable('');
        this.description = ko.observable('');
        this.code = ko.observable('');
    }

    try {
        viewModel = new CustomPartType(window.item_json);
        ko.options.deferUpdates = true;
        ko.applyBindings(viewModel);
        try {
            document.body.classList.add('loaded');
        } catch(e) {
            document.body.className += ' loaded';
        }
    } catch(e) {
        $('.page-loading').hide();
        $('.page-error')
            .show()
            .find('.trace')
                .html(e.message)
        ;
        throw(e);
    }
});
