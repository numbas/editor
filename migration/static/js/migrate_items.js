$(document).ready(function() {
    $('#publish-all').on('change',function() {
        $('input[type="checkbox"][name$="-published"]').prop('checked',$(this).prop('checked'));
    });

    $('#id_apply-all-project').on('change',function() {
        $('select[name^="own_items"][name$="-project"]').val($(this).val());
    });

    $('#id_apply-all-licence').on('change',function() {
        $('select[name^="own_items"][name$="-licence"]').val($(this).val());
    });
});
