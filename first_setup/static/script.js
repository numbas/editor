const toggles = [
    {key: 'DEBUG', className: 'is-dev'},
    {key: 'SU_CREATE', className: 'create-superuser'},
    {key: 'DB_ENGINE', className: 'uses-db-server', fn: (e) => e.value != 'sqlite3'}
]

toggles.forEach(({key, className, fn}) => {
    fn = fn || ((e) => e.checked);
    const q = document.getElementById(`question-${key}`);
    if(!q) {
        return;
    }
    function toggle() {
        document.body.classList.toggle(className,fn(q));
    }
    toggle();
    q.addEventListener('change', toggle);
});
