$(document).ready(function() {
    var user_search_url = $('#search_author').attr('data-autocomplete-url');
    function parseUser(user) { 
        return {label: user.name, value: user.name} 
    }
    var author_source = function(req,callback) {
        $(this).addClass('loading');
        $.getJSON(user_search_url,{q:req.term})
            .success(function(data) {
                var things = [];
                for(var i=0;i<data.length;i++) {
                    var thing = parseUser(data[i]);
                    things.push(thing);
                }
                callback(things);
            })
            .error(function() {
            })
            .complete(function() {
                $(this).removeClass('loading');
            })
        ;
    }
    $('#search_author')
        .autocomplete({
            source: author_source,
            select: function(e,ui) {
                $(this).val(ui.item.value);
                $(this).parents('form').submit();
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        })
    ;

    var ability_level_checkboxes = $('#ability_levels .checkbox');

    function show_ability_levels() {
        var v = $('#id_ability_framework').val();
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

    $('#id_ability_framework').on('change',show_ability_levels);

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

    $('#id_item_types, #id_subjects input, #id_topics input, #id_usage input, #id_status').on('change',form_changed('search-panel-form'));
    $('#ability_levels').on('change','input',form_changed);

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

