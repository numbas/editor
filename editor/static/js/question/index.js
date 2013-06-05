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
});

