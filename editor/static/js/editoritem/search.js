$(document).ready(function() {

    /**
     *  This tries not to use Knockout, but I've ended up having to use it for the taxonomy stuff.
     *  So it's ended up a bit of a mess. It should be rewritten to use KO exclusively.
     *  - Christian Lawson-Perfect
     */

    Editor.user_search_autocomplete(document.querySelectorAll('input[name="author"]'));

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

    function form_changed(form_id,timeout) {
        timeout = timeout || 500;
        return function() {
            if(form_change_timeouts[form_id]) {
                clearTimeout(form_change_timeouts[form_id]);
            }
            form_change_timeouts[form_id] = setTimeout(function() {
                document.getElementById(form_id).submit();
            },timeout);
        }
    }

    var taxonomies = Editor.taxonomies.map(function(t){ return new Editor.Taxonomy(t); });
    var used = {};
    Editor.used_taxonomy_nodes.forEach(function(pk){ used[pk] = true });
    function set_used(n) {
        n.used(used[n.pk]===true);
        n.children.forEach(set_used);
    }
    taxonomies.forEach(function(t){ t.trees.forEach(set_used); t.open(t.any_used()); });
    var vm = window.vm = {taxonomies: taxonomies};
    ko.applyBindings(vm);

    $('#id_item_types, #id_usage input, #id_status, #id_author').on('change',form_changed('search-panel-form'));
    $('#ability_levels').on('change','input[type="checkbox"]',form_changed('search-panel-form'));
    $('input[name="author"]').on('autocompleteselect',form_changed('search-panel-form'));

    $('#id_order_by').on('change',form_changed('order_by-form'));

    if($('.pager .previous a[href]').length) {
        Mousetrap.bind(['left','k'],function() {
            window.location = $('.pager .previous a').attr('href');
        });
    }
    if($('.pager .next a[href]').length) {
        Mousetrap.bind(['right','j'],function() {
            window.location = $('.pager .next a').attr('href');
        });
    }
    Mousetrap.bind(['/','?'],function() {
        $('#top-search-bar').focus();
        return false;
    });

});

