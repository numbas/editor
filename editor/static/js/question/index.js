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

    $('.question .delete').on('click',function(e) {
        e.stopPropagation();
        e.preventDefault();
        if(window.confirm('Delete this question?')) {
            var url = $(this).attr('href');
            var item = $(this).parents('.question');
            $.post(url,{csrfmiddlewaretoken: getCookie('csrftoken')})
                .success(function() {
                    item.slideUp(200,function() {item.remove()})
                })
                .error(function(response) {
                    noty({text: 'Error deleting question:\n\n'+response.responseText, layout: 'center', type: 'error'});
                })
            ;
        }
    });

    $('#question-list').tablesorter();

    $('#uploadButton').click(function(e) {
        e.preventDefault();
        $('#uploadForm input[type=file]').trigger('click');
    });
    $('#uploadForm input[type=file]').change(function(e) {
        $('#uploadForm').submit();
    });

    /*
	function loadFile(file) {
		if(!file) { return; }
		var fr = new FileReader();
		var contentInput = $('#uploadForm').find('[name=content]')
		fr.onload = function(e) {
			var content = e.target.result;
			contentInput.text(content);
			$('#uploadForm').submit();
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
            loadFile(e.dataTransfer.files[0]);
        }
    })
	.find('button').on('click',function(e) {
		e.preventDefault();
		e.stopPropagation();
		$('#uploadForm input[type=file]').click();
	})
	.end()
	.find('input[type=file]').on('change',function() {
		loadFile(this.files[0]);
		var file = this.files[0];
	});
    */

});
