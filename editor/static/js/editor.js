(function() {
	$(document).ready(function() {
		$('#preview').click(function() {
			$.post(
				Editor.exam_preview_url,
//				{
//					'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
//					'content': $('#id_content').val(),
//					'exam-edit-form': $('#exam-edit-form').serializeArray()
//				}
				$('#edit-form').serializeArray()
			)
			.success(function(response, status, xhr) {
				$('#preview-message').html(response);
				window.open("http://numbas.mas.ncl.ac.uk/numbas-previews/exam/");
			})
			.error(function(response, status, xhr) {
				$('#preview-message').html(response.responseText);
			});
		});
	});
})();