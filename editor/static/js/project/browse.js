function get_selection() {
    var selection = {
        folders: [],
        items: []
    }
    var folder_elements = document.querySelectorAll('.folder.drag-handle');
    for(var i=0;i<folder_elements.length;i++) {
        var checked = folder_elements[i].querySelector('.include-checkbox').checked;
        if(checked) {
            selection.folders.push(folder_elements[i].getAttribute('data-folder'));
        }
        folder_elements[i].classList.toggle('active',checked);
    }
    var item_elements = document.querySelectorAll('.item.drag-handle');
    for(var i=0;i<item_elements.length;i++) {
        var checked = item_elements[i].querySelector('.include-checkbox').checked
        if(checked) {
            selection.items.push(item_elements[i].getAttribute('data-item'));
        }
        item_elements[i].classList.toggle('active',checked);
    }
    selection.empty = selection.folders.concat(selection.items).length==0;
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
        return document.querySelector('#contents .folder[data-folder="'+folder_pk+'"]');
    });
    var item_rows = selection.items.map(function(item_pk) {
        return document.querySelector('#contents .item[data-item="'+item_pk+'"]');
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
            update_selection();
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

var move_selected_folder = null;
function move_select_folder(pk) {
    if(pk!==null) {
        move_selected_folder = pk;
        document.querySelector('#move-modal .btn.move').removeAttribute('disabled');
    } else {
        move_selected_folder = null;
        document.querySelector('#move-modal .btn.move').setAttribute('disabled',true);
    }

    var selected = document.querySelectorAll('#move-modal .selected');
    for(var i=0;i<selected.length;i++) {
        selected[i].classList.remove('selected');
    }
    var item = document.querySelector('#move-modal .folder[data-folder="'+pk+'"]');
    if(item) {
        item.classList.add('selected');
    }
}
function make_folder_dialog() {
    var toplevel = document.querySelector('#move-modal .folder-list.top-level > .folder');
    function add_subfolders(fdata,item) {
        var folder = fdata.folder;


        if(fdata.folder) {
            var div_name = document.createElement('div');
            div_name.classList.add('name');
            item.appendChild(div_name);
            div_name.innerHTML  = '<span class="glyphicon glyphicon-folder-close" aria-label="Closed folder"></span> ';
            div_name.innerHTML += '<span class="glyphicon glyphicon-folder-open" aria-label="Open folder"></span> ';
            var a = document.createElement('a');
            div_name.appendChild(a);
            a.setAttribute('href',fdata.folder.url);
            a.textContent = fdata.folder.name;
        }

        var pk = folder ? folder.pk : -1;
        item.setAttribute('data-folder',pk);
        item.addEventListener('click',function(e) {
            e.preventDefault();
            e.stopPropagation();
            if(pk==move_selected_folder || !item.classList.contains('expanded')) {
                item.classList.toggle('expanded');
            }
            move_select_folder(folder ? folder.pk : -1);
        })
        if(!fdata.folder) {
            item.classList.add('expanded');
        }

        if(fdata.subfolders.length) {
            var sublist = document.createElement('ul');
            item.appendChild(sublist);
            sublist.classList.add('folder-list');
            fdata.subfolders.forEach(function(fdata2) {
                var li = document.createElement('li');
                li.classList.add('folder');
                add_subfolders(fdata2,li);
                sublist.appendChild(li);
            });
        } else {
            item.classList.add('expanded');
        }
    }
    add_subfolders({folder:null, subfolders: folder_hierarchy_data},toplevel);
}

function update_selection() {
    var selection = get_selection();
    document.body.classList.toggle('items-selected', !selection.empty);
}

var folder_hierarchy_data = JSON.parse(document.getElementById('folder-hierarchy-data').textContent);

make_folder_dialog();
move_select_folder(null);

var rows = document.querySelectorAll('.contents .drag-handle');
for(var i=0;i<rows.length;i++) {
    make_dragger(rows[i]);
}

var targets = document.querySelectorAll('.drag-target');
for(var i=0;i<targets.length;i++) {
    make_target(targets[i]);
}

var checkboxes = document.querySelectorAll('.drag-handle .include-checkbox');
document.getElementById('select-all').addEventListener('click',function() {
    for(var i=0;i<checkboxes.length;i++) {
        checkboxes[i].checked = true;
    }
    update_selection();
});
document.getElementById('select-none').addEventListener('click',function() {
    for(var i=0;i<checkboxes.length;i++) {
        checkboxes[i].checked = false;
    }
    update_selection();
});
for(var i=0;i<checkboxes.length;i++) {
    checkboxes[i].addEventListener('change',update_selection);
}
update_selection();
document.querySelector('#move-modal .btn.move').addEventListener('click',function() {
    if(move_selected_folder!==null) {
        move_to(move_selected_folder,get_selection());
    }
    $('#move-modal').modal('hide');
});
$('#move-modal').on('show.bs.modal',function() {
});

document.querySelector('.table.contents').addEventListener('click',function(e) {
    if(e.target.matches('a')) {
        return;
    }
    if(e.target.matches('.table.contents .drag-handle *')) {
        var el = e.target;
        while(el && !el.classList.contains('drag-handle')) {
            el = el.parentElement;
            if(el.matches('a')) {
                return;
            }
        }
        if(!el) {
            return;
        }
        if(e.target.matches('.include-checkbox')) {
            return;
        }
        var checkbox = el.querySelector('.include-checkbox');
        checkbox.checked = !checkbox.checked;
        update_selection();
    }
});
