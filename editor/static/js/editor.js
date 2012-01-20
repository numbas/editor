(function() {
	$(document).ready(function() {
		console.log(Editor);
		$('#exam-preview').click(function() {
//			$('#some-stuff').load('{% url exam_ajaxtest %}');
			$('#some-stuff').load(Editor.ajaxurl);
		});
	});
})();