window.addEventListener('DOMContentLoaded',function() {
    const source_element = document.getElementById('id_source');
    let extension = filename.match(/\.(.*)$/);
    extension = extension ? extension[1] : 'js';

    const modes = {
        'js': 'javascript',
        'jme': 'jme',
        'cpt': 'jme',
        'md': 'markdown',
        'html': 'htmlmixed',
        'css': 'css'
    }
    const mc = CodeMirror.fromTextArea(source_element,{
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true,
        mode: modes[extension] || 'javascript',
        indentWithTabs: false,
        indentUnit: 2,
        lineWrapping: Editor.wrapLines,
        readOnly: !editable
    });

    const save_button = document.getElementById('save');
    mc.on('change',function() {
        save_button.classList.remove('btn-default');
        save_button.classList.add('btn-primary');
    });

    const replace_button = document.getElementById('replace');
    Editor.receive_file_drops(replace_button, ev => {
        document.querySelector('#replace-file-modal #id_content').files = ev.dataTransfer.files;
        document.querySelector('#replace-file-modal form').submit();
    });
});

