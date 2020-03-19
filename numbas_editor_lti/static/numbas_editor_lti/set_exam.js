function exam_search() {
    console.log('set up exam search');
    var element = $('#exam-search');
    console.log(element);
    var url = '/lti/exam_search';
    source = function(req,callback) {
        element.addClass('loading');
        $.getJSON(url,{query:req.term})
            .success(function(data) {
                var things = data.items.map(function(d) {
                    return {label: d.autocomplete_entry, value: d.name, id: d.id}
                });
                callback(things);
            })
            .complete(function() {
                $(element).removeClass('loading');
            })
        ;
    }
    element.autocomplete({source: source, select: set_exam, html: true});

    function set_exam(e,ui) {
        var id = ui.item.id;
        element.parents('form').find('[name="exam"]').val(id);
        element.parents('form').submit();
    }
}

document.addEventListener('DOMContentLoaded',function() {
    console.log('oi');
    exam_search();
});
