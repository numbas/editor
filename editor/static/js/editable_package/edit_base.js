window.addEventListener('DOMContentLoaded',function() {
    const upload_button = document.getElementById('upload');
    Editor.receive_file_drops(upload_button, ev => {
        document.querySelector('#upload-file-modal #id_content').files = ev.dataTransfer.files;
        document.querySelector('#upload-file-modal form').submit();
    });
});
