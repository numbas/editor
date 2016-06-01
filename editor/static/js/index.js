$(document).ready(function() {
    $('#project_filter').on('input',function() {
        var q = $(this).val().toLowerCase();
        $('.projects .list-group-item').each(function() {
            var name = $(this).attr('data-name').toLowerCase();
            $(this).toggleClass('hidden',q!='' && (name.indexOf(q)==-1));
        });
    });
});
