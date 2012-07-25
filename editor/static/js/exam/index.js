$(document).ready(function() {
	$('#newExam').click(function(e) {
		e.preventDefault();
		e.stopPropagation();

		$('#newExam').hide();
		$('#newExamForm')
			.show()
			.css('display','inline-block')
			.find('input[name="name"]')
				.focus()
		;
	});

	function cancelCreate() {
		$('#newExam').show();
		$('#newExamForm').hide();
	}

	$('#newExamForm')
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

	$('.exam .delete').on('click',function(e) {
		e.stopPropagation();
		e.preventDefault();
		if(window.confirm('Delete this exam?')) {
			var url = $(this).attr('href');
			var item = $(this).parents('.exam');
			$.post(url,{csrfmiddlewaretoken: getCookie('csrftoken')})
				.success(function() {
					item.slideUp(200,function() {item.remove()})
				})
				.error(function(response) {
					noty({text: 'Error deleting exam:\n\n'+response.responseText, layout: 'center', type: 'error'});
				})
			;
		}
	});

    $('#upload').click(function(e) {
        if(!$('#uploadForm input[type=file]').val().length) {
            e.preventDefault();
            e.stopPropagation();
            $('#uploadForm input[type=file]').trigger('click');
        }
    });
    $('#uploadForm input[type=file]').change(function(e) {
        if($.browser.msie)
            $('#upload').text('Click again to upload');
        else
            $('#uploadForm').submit();
    });

/*
	function uploadFile(content) {
		contentInput.text(content);
		$('#uploadForm').submit();
	}

	function loadFile(file) {
		if(!file) { return; }
		var fr = new FileReader();
		var contentInput = $('#uploadForm').find('[name=content]')
		fr.onload = function(e) {
			var content = e.target.result;
			uploadFile(content);
		}
		fr.readAsText(file);
	}

    $.event.props.push('dataTransfer');
    $('#uploadForm').on({
        dragenter: function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).addClass('over')
        },
        dragover: function(e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).addClass('over')
        },
        dragleave: function(e) {
            $(this).removeClass('over');
        },
        drop: function(e) {
            $(this).removeClass('over');
			if('files' in e.dataTransfer)
	            loadFile(e.dataTransfer.files[0]);
			else
			{
				console.log(JSON.stringify(e.dataTransfer));
			//	uploadFile(e.dataTransfer.getData('text'));
			}
        }
    })
	.find('button').on('click',function(e) {
		e.preventDefault();
		e.stopPropagation();
		$('#uploadForm input[type=file]').click();
	})
	.end()
	.find('input[type=file]').on('change',function() {
		if(this.files)
			loadFile(this.files[0]);
		else
		{
//			$('textarea[name=content]').remove();
//			$(this).attr('name','content');
			$('#uploadForm').submit();
		}
	});
*/
	function ExamResult(data) {
		if(!('id' in data))
			throw(new Error('Search result doesn\'t have an ID: '+json.dumps(data)));
		this.id = data.id;
		this.name = data.name || 'Untitled Exam';
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

    function ExamSelect()
    {
		var vm = this;

		this.search = {
			query: ko.observable(''),
			author: ko.observable(''),
			results: {
				raw: ko.observableArray([]),
				all: Editor.mappedObservableArray(function(d){ return new ExamResult(d) }),
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
                deleteExam: function(q) {
                    if(window.confirm('Delete this exam?')) {
                        var results = this;
                        var item = $(this).parents('.exam');
                        $.post(q.deleteURL,{csrfmiddlewaretoken: getCookie('csrftoken')})
                            .success(function() {
                                results.all.remove(q);
                            })
                            .error(function(response) {
                                noty({text: 'Error deleting exam:\n\n'+response.responseText, layout: 'center', type: 'error'});
                            })
                        ;
                    }
                }
			},
			searching: ko.observable(false),
			realMine: ko.observable(false),
			clearMine: function() {
				this.search.mine(false);
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

		Editor.searchBinding(this.search,'/exams/search/',function() {
			return {
				q: vm.search.query(),
				author: vm.search.author(),
				mine: vm.search.mine()
			};
		});

		Mousetrap.bind('left',function() { vm.search.results.prevPage.apply(vm.search.results) });
		Mousetrap.bind('right',function() { vm.search.results.nextPage.apply(vm.search.results) });

		//save state in browser history - restore query when you go back to this page
		if(history.state) {
			if('query' in history.state)
				vm.search.query(history.state.query);
			if('author' in history.state)
				vm.search.author(history.state.author);
			if('mine' in history.state)
				vm.search.mine(history.state.mine);
			if('results' in history.state)
				vm.search.results.all(history.state.results);
			if('page' in history.state)
				vm.search.results.page(history.state.page);
		}
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
    
    //create a view model
    viewModel = new ExamSelect();
    ko.applyBindings(viewModel);


});

