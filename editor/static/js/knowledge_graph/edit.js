var viewModel;

$(document).ready(function() {

    function KnowledgeGraph(data) {
        var kg = this;
        this.pk = data.pk;
        this.name = ko.observable('');
        this.description = ko.observable('');
        this.topics = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);
        this.current_topic = ko.observable(null);
        this.current_learning_objective = ko.observable(null);

        this.add_topic = function() {
            var t = new Topic(kg);
            kg.topics.push(t);
            kg.current_topic(t);
            return t;
        }

        this.remove_topic = function(t) {
            kg.topics.remove(t);
        }

        this.add_learning_objective = function() {
            var lo = new LearningObjective(kg);
            kg.learning_objectives.push(lo);
            kg.current_learning_objective(lo);
            return lo;
        }

        this.remove_learning_objective = function(lo) {
            kg.learning_objectives.remove(lo);
        }

        ko.computed(function() {
            this.topics().forEach(function(t) {
                t.leads_to([]);
            });

            this.topics().forEach(function(t) {
                t.depends_on().forEach(function(t2) {
                    t2.leads_to.push(t);
                });
            });
        },this);

        if(data) {
            this.load(data);
        }
    }
    KnowledgeGraph.prototype = {
        load: function(data) {
            var kg = this;
            this.pk = data.pk;
            this.name(data.name);
            this.description(data.description);

            var topics = [];
            data.topics.forEach(function(td) {
                topics.push(new Topic(kg,td));
            });
            var learning_objectives = [];
            data.learning_objectives.forEach(function(lod) {
                learning_objectives.push(new LearningObjective(kg,lod));
            })

            data.topics.forEach(function(td,i) {
                topics[i].depends_on(td.depends_on.map(function(pk) { return topics.find(function(t2) { return t2.pk == pk; }) }));
                topics[i].learning_objectives(td.learning_objectives.map(function(pk) { return learning_objectives.find(function(lo) { return lo.pk == pk; }) }));
            })
            kg.topics(topics);
            kg.learning_objectives(learning_objectives);
        },

        toJSON: function() {
            var o = {
                name: this.name(),
                description: this.description(),
                data: JSON.stringify({
                    topics: this.topics().map(function(t) { return t.toJSON(); }),
                    learning_objectives: this.learning_objectives().map(function(lo) { return lo.toJSON(); })
                })
            }
            return o;
        }
    }

    function Topic(graph,data) {
        var t = this;
        this.graph = graph;
        this.name = ko.observable('');
        this.label = ko.computed(function() {
            return this.name().trim() || 'Unnamed topic';
        },this);
        this.depends_on = ko.observableArray([]);
        this.leads_to = ko.observableArray([]);
        this.learning_objectives = ko.observableArray([]);

        this.description = ko.observable('');

        this.dependency_autocomplete = Editor.autocomplete_source(this, graph.topics, this.depends_on);

        this.leads_to_autocomplete = Editor.autocomplete_source(this, graph.topics, this.leads_to);

        this.add_dependency = function(t2) {
            t.depends_on.push(t2);
        }
        this.remove_dependency = function(t2) {
            t.depends_on.remove(t2);
        }

        this.add_leads_to = function(t2) {
            t2.depends_on.push(t);
        }
        this.remove_leads_to = function(t2) {
            t2.depends_on.remove(t);
        }

        this.learning_objective_autocomplete = Editor.autocomplete_source(this, graph.learning_objectives, this.learning_objectives);
        this.add_learning_objective = function(lo) {
            t.learning_objectives.push(lo);
        }
        this.remove_learning_objective = function(lo) {
            t.learning_objectives.remove(lo);
        }

        if(data) {
            this.load(data);
        }
    }
    Topic.prototype = {
        load: function(data) {
            this.pk = data.pk;
            this.name(data.name);
            this.description(data.description);
        },

        reference: function() {
            return {pk: this.pk, name: this.name()}
        },
        toJSON: function() {
            var o = {
                pk: this.pk,
                name: this.name(),
                description: this.description(),
                depends_on: this.depends_on().map(function(t) { return t.reference(); }),
                learning_objectives: this.learning_objectives().map(function(lo) { return lo.reference(); })
            }
            return o;
        }
    }

    function LearningObjective(graph,data) {
        this.graph = graph;
        this.name = ko.observable('');
        this.label = ko.computed(function() {
            return this.name().trim() || 'Unnamed topic';
        },this);
        this.description = ko.observable('');

        if(data) {
            this.load(data);
        }
    }
    LearningObjective.prototype = {
        load: function(data) {
            this.pk = data.pk;
            this.name(data.name);
            this.description(data.description);
        },

        reference: function() {
            return {pk: this.pk, name: this.name()}
        },
        toJSON: function() {
            var o = {
                pk: this.pk,
                name: this.name(),
                description: this.description()
            }
            return o;
        }
    }

    var data = JSON.parse(document.getElementById('json').textContent);

    try {
        var kg = new KnowledgeGraph(data);

        viewModel = {
            tabber: new Editor.Tabber([
                {id: 'topics', title: 'Topics', icon: 'book'},
                {id: 'learning-objectives', title: 'Learning objectives', icon: 'ok'},
                {id: 'settings', title: 'Settings', icon: 'cog'}
            ]),
            graph: kg,
            show_topic: function(t) {
                kg.current_topic(t);
                viewModel.tabber.setTab('topics')();
            },
            show_learning_objective: function(lo) {
                kg.current_learning_objective(lo);
                viewModel.tabber.setTab('learning-objectives')();
            }
        };

        var autoSave = Editor.saver(
            function() {
                var data = viewModel.graph.toJSON();
                return data;
            },
            function(data) {
                var promise = $.post(
                    '/knowledge-graph/'+viewModel.graph.pk+'/edit',
                    {json: JSON.stringify(data), csrfmiddlewaretoken: getCookie('csrftoken')}
                )
                    .success(function(data){
                        data.topics.forEach(function(td) {
                            var t = viewModel.graph.topics().find(function(t) { return t.name()==td.name; });
                            if(t) {
                                t.pk = td.pk;
                            }
                        });
                        data.learning_objectives.forEach(function(lod) {
                            var lo = viewModel.graph.learning_objectives().find(function(lo) { return lo.name()==lod.name; });
                            if(lo) {
                                lo.pk = lod.pk;
                            }
                        });
                    })
                    .error(function(response,type,message) {
                        if(message=='') {
                            message = 'Server did not respond.';
                        }

                        noty({
                            text: 'Error saving item:\n\n'+message,
                            layout: "topLeft",
                            type: "error",
                            textAlign: "center",
                            animateOpen: {"height":"toggle"},
                            animateClose: {"height":"toggle"},
                            speed: 200,
                            timeout: 5000,
                            closable:true,
                            closeOnSelfClick: true
                        });
                    })
                ;
                return promise;
            }
        );

        ko.options.deferUpdates = true;
        ko.applyBindings(viewModel);
        try {
            document.body.classList.add('loaded');
        } catch(e) {
            document.body.className += ' loaded';
        }

        show_graph(viewModel.graph);
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
