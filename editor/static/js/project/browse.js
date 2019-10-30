function get_selection() {
    var selection = {
        folders: [],
        items: []
    }
    var folder_elements = document.querySelectorAll('.folder.drag-handle');
    for(var i=0;i<folder_elements.length;i++) {
        if(folder_elements[i].querySelector('.include-checkbox').checked) {
            selection.folders.push(folder_elements[i].getAttribute('data-folder'));
        }
    }
    var item_elements = document.querySelectorAll('.item.drag-handle');
    for(var i=0;i<item_elements.length;i++) {
        if(item_elements[i].querySelector('.include-checkbox').checked) {
            selection.items.push(item_elements[i].getAttribute('data-item'));
        }
    }
    return selection;
}

function move_to(target_pk,selection) {
    var data = {
        csrfmiddlewaretoken: getCookie('csrftoken'),
        project: project_pk,
        parent: target_pk,
        folders: selection.folders,
        items: selection.items
    }
    var folder_rows = selection.folders.map(function(folder_pk) {
        return document.querySelector('.folder[data-folder="'+folder_pk+'"]');
    });
    var item_rows = selection.items.map(function(item_pk) {
        return document.querySelector('.item[data-item="'+item_pk+'"]');
    });
    var all_rows = folder_rows.concat(item_rows).filter(function(row) { return row });
    all_rows.forEach(function(row) {
        row.classList.add('moving');
    })
    $.post({
        url: '/folder/move',
        data: data,
        traditional: true
    })
        .then(function(r) {
            all_rows.forEach(function(row) {
                if(row.parentElement) {
                    row.parentElement.removeChild(row)
                }
            });
            noty({
                text: r.message,
                layout: 'topCenter',
            });
            num_items -= r.items_moved;
            document.getElementById('num-items').textContent = num_items+' item'+(num_items==1 ? '' : 's');
            if(num_items<=0) {
                document.getElementById('contents-container').classList.add('empty');
            }
        })
        .fail(function(r) {
            all_rows.forEach(function(row) {
                row.classList.remove('moving');
            });
        })
    ;
}

function make_dragger(row) {
    var folder_pk = row.getAttribute('data-folder');
    var item_pk = row.getAttribute('data-item');
    row.addEventListener('dragstart',function(e) {
        row.classList.add('dragging');
        var name = row.querySelector('.name a').textContent;
        e.dataTransfer.setData('text/plain',name);
        e.dataTransfer.setData('numbas/folder-contents',name);
        if(row.classList.contains('item')) {
            e.dataTransfer.setData('numbas/item',row.getAttribute('data-item'));
        } else if(row.classList.contains('folder')) {
            e.dataTransfer.setData('numbas/folder',row.getAttribute('data-folder'));
        }
        e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend',function(e) {
        row.classList.remove('dragging');
    });

    row.querySelector('.include-checkbox').addEventListener('change',function(e) {

    });
}

function make_target(target) {
    var target_pk = target.getAttribute('data-folder');

    target.addEventListener('dragover',function(e) {
        if(!e.dataTransfer.types.includes('numbas/folder-contents')) {
            return;
        }
        var selection = get_selection();
        if(e.dataTransfer.getData('numbas/folder')==target_pk || selection.folders.indexOf(target_pk)>=0) {
            return;
        }
        e.preventDefault();
        target.classList.add('dragover');
    });

    target.addEventListener('dragleave',function(e) {
        target.classList.remove('dragover');
    });

    target.addEventListener('drop',function(e) {
        if(!e.dataTransfer.types.includes('numbas/folder-contents')) {
            return;
        }
        e.preventDefault();
        target.classList.remove('dragover');
        var item_pk = e.dataTransfer.getData('numbas/item');
        var folder_pk = e.dataTransfer.getData('numbas/folder');
        var selection = get_selection();
        if(item_pk!='') {
            if(selection.items.indexOf(item_pk)==-1) {
                selection.items.push(item_pk);
            }
        } else if(folder_pk!='') {
            if(selection.folders.indexOf(folder_pk)==-1) {
                selection.folders.push(folder_pk);
            }
        }
        move_to(target_pk,selection);
    });
}

var rows = document.querySelectorAll('.contents .drag-handle');
for(var i=0;i<rows.length;i++) {
    make_dragger(rows[i]);
}

var targets = document.querySelectorAll('.drag-target');
for(var i=0;i<targets.length;i++) {
    make_target(targets[i]);
}

document.getElementById('select-all').addEventListener('click',function() {
    var checkboxes = document.querySelectorAll('.drag-handle .include-checkbox');
    for(var i=0;i<checkboxes.length;i++) {
        checkboxes[i].checked = true;
    }
});
document.getElementById('select-none').addEventListener('click',function() {
    var checkboxes = document.querySelectorAll('.drag-handle .include-checkbox');
    for(var i=0;i<checkboxes.length;i++) {
        checkboxes[i].checked = false;
    }
});
