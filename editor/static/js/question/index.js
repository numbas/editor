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
        var qr = this;

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

        this.last_modified = moment(data.last_modified,'YYYY-MM-DD HH:mm:ss.SSS');
        this.progress = data.progress;
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
                    if(window.confirm('Really delete this question? You won\'t be able to get it back.')) {
                        var results = this;
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
			if('page' in history.state)
                vm.search.restorePage = history.state.page;
		}
		if(history.replaceState) {
			ko.computed(function() {
				history.replaceState({
					page: vm.search.results.page(),
					query: vm.search.query(),
					author: vm.search.author(),
					mine: vm.search.mine()
				},'',window.location.pathname);
			})
		}

		Editor.searchBinding(this.search,'/questions/search/',makeQuery);
        delete vm.search.restorePage;
    }

    
    //create a view model
    viewModel = new QuestionSelect();
    ko.applyBindings(viewModel);
    
});

