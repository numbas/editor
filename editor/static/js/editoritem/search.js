$(document).ready(function() {
    Editor.user_search_autocomplete($('input[name="author"]'));
    ['open','close','select','change','create','search'].forEach(function(p){
    });

    var ability_level_checkboxes = $('#ability_levels .checkbox');

    function show_ability_levels() {
        var v = $('#search-panel-form #id_ability_framework').val();
        ability_level_checkboxes.each(function() {
            if(!this.hasAttribute('data-framework')) {
                return;
            }
            var framework = $(this).attr('data-framework');
            $(this).toggle(framework==v);
            if(framework==v) {
                $('#ability_levels').append(this);
            } else {
                $(this).remove();
                $(this).find('input').prop('checked',false);
            }
        });
    }
    show_ability_levels();

    $('#search-panel-form #id_ability_framework').on('change',show_ability_levels);

    var form_change_timeouts = {};

    function submit() {
        $('#search-form').submit();
    }

    function form_changed(form_id) {
        return function() {
            if(form_change_timeouts[form_id]) {
                clearTimeout(form_change_timeouts[form_id]);
            }
            form_change_timeouts[form_id] = setTimeout(function() {
                document.getElementById(form_id).submit();
            },500);
        }
    }

    $('#id_item_types, #id_subjects input, #id_topics input, #id_usage input, #id_status, #id_author').on('change',form_changed('search-panel-form'));
    $('#ability_levels').on('change','input[type="checkbox"]',form_changed('search-panel-form'));
    $('input[name="author"]').on('autocompleteselect',form_changed('search-panel-form'));

    $('#id_order_by').on('change',form_changed('order_by-form'));

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

