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

	$('#exam-list').tablesorter();

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
});

