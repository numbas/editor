$(document).ready(function() {
    $('#newQuestion').click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        $('#newQuestion').hide();
        $('#newQuestionForm')
            .show()
            .css('display','inline-block')
            .find('input[name="name"]')
                .focus()
        ;
    });

    function cancelCreate() {
        $('#newQuestion').show();
        $('#newQuestionForm').hide();
    }

    $('#newQuestionForm')
        .hide()
        .submit(function(e) {
            var name = $(this).find('input[name="name"]').val();
            if(!name.trim().length)
            {
                e.preventDefault();
                e.stopPropagation();
            }
        })
        .find('input[name="name"]')
            .keyup(function(e) {
                if(e.which==27)
                    cancelCreate();
            })
    ;

    
    $('#upload').click(function(e) {
        e.preventDefault();
        $('#uploadForm input[type=file]').trigger('click');
    });
    $('#uploadForm input[type=file]').change(function(e) {
        $('#uploadForm').submit();
    });
        
	function QuestionResult(data) {
		if(!('id' in data))
			throw(new Error('Search result doesn\'t have an ID: '+json.dumps(data)));
		this.id = data.id;
		this.name = data.name || 'Untitled Question';
		this.metadata = {
			description: '',
			notes: ''
		};
		if(typeof data.metadata == 'object')
			this.metadata = $.extend(this.metadata,data.metadata);
		this.author = data.author;
		this.url = data.url || '';
		this.deleteURL = data.deleteURL || '';
		this.canEdit = data.canEdit || false;
	}

    function QuestionSelect()
    {
		var vm = this;

		this.search = {
			query: ko.observable(''),
			author: ko.observable(''),
			results: {
				raw: ko.observableArray([]),
				all: Editor.mappedObservableArray(function(d){ return new QuestionResult(d) }),
				page: ko.observable(1),
				prevPage: function() {
					var page = this.page();
					if(page>1)
						this.page(page-1);
				},
				nextPage: function() {
					var page = this.page();
					if(page<this.pages().length)
						this.page(page+1);
				},
                deleteQuestion: function(q) {
                    if(window.confirm('Delete this question?')) {
                        var results = this;
                        var item = $(this).parents('.question');
                        $.post(q.deleteURL,{csrfmiddlewaretoken: getCookie('csrftoken')})
                            .success(function() {
                                results.all.remove(q);
                            })
                            .error(function(response) {
                                noty({text: 'Error deleting question:\n\n'+response.responseText, layout: 'center', type: 'error'});
                            })
                        ;
                    }
                }
			},
			realMine: ko.observable(false),
			clearMine: function() {
				vm.search.mine(false);
			}
		}
		this.search.results.pages = ko.computed(function() {
			this.page(1);

			var results = this.all();
			var pages = [];
			for(var i=0;i<results.length;i+=10) {
				pages.push(results.slice(i,i+10));
			}

			return pages;
		},this.search.results);
		this.search.results.pageText = ko.computed(function() {
			return this.page()+'/'+this.pages().length;
		},this.search.results);

		ko.computed(function() {
			vm.search.results.all(vm.search.results.raw());
		});


		this.search.mine = ko.computed({
			read: function() {
				return this.realMine();
			},
			write: function(v) {
				this.realMine(v);
				if(v)
					this.author('');
			}
		},this.search);

		function makeQuery() {
			return {
				q: vm.search.query(),
				author: vm.search.author(),
				mine: vm.search.mine()
			};
		}
		Editor.searchBinding(this.search,'/questions/search/',makeQuery);

		Mousetrap.bind('left',function() { vm.search.results.prevPage.apply(vm.search.results) });
		Mousetrap.bind('right',function() { vm.search.results.nextPage.apply(vm.search.results) });


		//save state in browser history - restore query when you go back to this page
		if(history.state) {
			vm.search.lastID = null;
			if('query' in history.state)
				vm.search.query(history.state.query);
			if('author' in history.state)
				vm.search.author(history.state.author);
			if('mine' in history.state)
				vm.search.mine(history.state.mine);
			if('results' in history.state)
				vm.search.results.raw(history.state.results);
			if('page' in history.state)
				vm.search.results.page(history.state.page);
			vm.search.lastQuery = makeQuery();
		}
		if(history.replaceState) {
			ko.computed(function() {
				history.replaceState({
					page: vm.search.results.page(),
					query: vm.search.query(),
					author: vm.search.author(),
					mine: vm.search.mine(),
					results: vm.search.results.raw()
				});
			})
		}
    }

    
    //create a view model
    viewModel = new QuestionSelect();
    ko.applyBindings(viewModel);
    
});

