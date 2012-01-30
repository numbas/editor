(function() {
	$(document).ready(function() {
		$('#exam-preview').click(function() {
//			$('#some-stuff').load('{% url exam_ajaxtest %}');
//			$('#some-stuff').load(
			$.post(
				Editor.exam_preview_url,
				{
					'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val(),
					'content': $('#id_content').val()
				}
			)
			.success(function(response, status, xhr) {
				$('#exam-preview-message').html(response);
				window.open("http://countach.ncl.ac.uk/numbas-previews/exam/");
			})
			.error(function(response, status, xhr) {
				$('#exam-preview-message').html(response.responseText);
				console.log(response.responseText);
			});
		});
	});
})();