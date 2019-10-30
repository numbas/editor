function move_item(item_pk,target_pk) {
    var data = {
        csrfmiddlewaretoken: getCookie('csrftoken'),
        folder: target_pk
    }
    var item_row = document.querySelector('.item[data-pk="'+item_pk+'"]');
    if(!item_row) {
        return;
    }
    item_row.classList.add('moving');
    $.post('/item/'+item_pk+'/move_folder',data)
        .then(function(r) {
            item_row.parentElement.removeChild(item_row);
        })
        .fail(function(r) {
            item_row.classList.remove('moving');
        })
    ;
}

function move_folder(folder_pk,target_pk) {
    var data = {
        csrfmiddlewaretoken: getCookie('csrftoken'),
        parent: target_pk
    }
    var folder_row = document.querySelector('.contents .folder[data-folder="'+folder_pk+'"]');
    if(!folder_row) {
        return;
    }
    folder_row.classList.add('moving');
    $.post('/folder/'+folder_pk+'/move',data)
        .then(function(r) {
            folder_row.parentElement.removeChild(folder_row);
        })
        .fail(function(r) {
            folder_row.classList.remove('moving');
        })
    ;
}

function make_dragger(row) {
    row.addEventListener('dragstart',function(e) {
        row.classList.add('dragging');
        var name = row.querySelector('.name a').textContent;
        e.dataTransfer.setData('text/plain',name);
        e.dataTransfer.setData('numbas/folder-contents',name);
        if(row.classList.contains('item')) {
            e.dataTransfer.setData('numbas/item',row.getAttribute('data-pk'));
        } else if(row.classList.contains('folder')) {
            e.dataTransfer.setData('numbas/folder',row.getAttribute('data-folder'));
        }
        e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend',function(e) {
        row.classList.remove('dragging');
    });
}

function make_target(target) {
    var target_pk = target.getAttribute('data-folder');

    target.addEventListener('dragover',function(e) {
        if(!e.dataTransfer.types.includes('numbas/folder-contents')) {
            return;
        }
        if(e.dataTransfer.getData('numbas/folder')==target_pk) {
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
        if(item_pk!='') {
            move_item(folder_pk,target_pk);
        } else if(folder_pk!='') {
            move_folder(folder_pk,target_pk);
        }
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

document.querySelector('.contents').addEventListener('change',function(e) {
    if(!e.target.classList.contains('include-checkbox')) {
        return;
    }
    console.log(e.target);
});
