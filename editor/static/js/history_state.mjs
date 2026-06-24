export function save(key, value) {
    const state = history.state || {};
    state[key] = value;
    history.replaceState(state, window.title);
}

export function get(key) {
    const state = history.state || {};
    return state[key];
}
