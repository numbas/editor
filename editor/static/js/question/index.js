$(document).ready(function() {
    $('#upload').on('click',function(e) {
        e.preventDefault();
        $('#uploadForm input[type=file]').trigger('click');
    });
    $('#uploadForm input[type=file]').change(function(e) {
        $('#uploadForm').submit();
    });
       
    $('.question .delete').on('click',function(e) {
        e.preventDefault();
        e.stopPropagation();
        if(window.confirm('Really delete this question? You won\'t be able to get it back.')) {
            $.post($(this).attr('href'),{csrfmiddlewaretoken: getCookie('csrftoken')})
                .success(function() {
                    window.location.reload();
                })
                .error(function(response) {
                    noty({text: 'Error deleting question:\n\n'+response.responseText, layout: 'center', type: 'error'});
                })
            ;
        }
    });

	var user_search_url = $('#search_author').attr('data-autocomplete-url');
	function parseUser(user) { 
		return {label: user.name, value: user.name} 
	}
	var author_source = function(req,callback) {
		$(this).addClass('loading');
		$.getJSON(user_search_url,{q:req.term})
			.success(function(data) {
				var things = [];
				for(var i=0;i<data.length;i++) {
					var thing = parseUser(data[i]);
					things.push(thing);
				}
				callback(things);
			})
			.error(function() {
			})
			.complete(function() {
				$(this).removeClass('loading');
			})
		;
	}
	$('#search_author')
		.autocomplete({
			source: author_source,
			select: function(e,ui) {
				$(this).val(ui.item.value);
				$(this).parents('form').submit();
				e.stopPropagation();
				e.preventDefault();
				return false;
			}
		})
	;

	$('#id_usage,#id_filter_copies,#id_only_ready_to_use').on('change',function() {
		$(this).parents('form').submit();
	});

	if($('.pagination .previous[href]').length) {
		Mousetrap.bind(['left','k'],function() {
			window.location = $('.pagination .previous').attr('href');
		});
	}
	if($('.pagination .next[href]').length) {
		Mousetrap.bind(['right','j'],function() {
			window.location = $('.pagination .next').attr('href');
		});
	}
	Mousetrap.bind(['/','?'],function() {
		$('#search_query').focus();
		return false;
	});
});

