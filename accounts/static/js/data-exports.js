async function update() {
    const response = await fetch('data-exports', {headers: {'Accept': 'application/json'}});
    const data = await response.json();

    const table = document.querySelector('table#data-exports');
    const new_table = document.createElement('div');
    new_table.innerHTML = data.table;
    if(table.textContent.trim() != new_table.textContent.trim()) {
        table.outerHTML = data.table;
    }
}
update();

setInterval(() => {
    if(!document.hidden) {
        update();
    }
}, 5000);

document.addEventListener('visibilitychange', () => {
    if(!document.hidden) {
        update();
    }
});
