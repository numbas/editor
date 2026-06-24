export function getCSRFtoken() {
    var inp = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if(inp) {
        return inp.value;
    } else {
        return getCookie('csrftoken');
    }
}


