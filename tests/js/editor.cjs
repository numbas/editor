const fs = require('node:fs');
const path = require('node:path');
const {JSDOM} = require('jsdom');

async function createEditor() {
    const root = path.resolve(__dirname, '../..');
    const dom = new JSDOM('<!doctype html><body><input id="top-search-bar"></body>', {
        url: 'https://editor.test/question/', runScripts: 'outside-only'
    });
    const window = dom.window;
    const load = file => window.eval(fs.readFileSync(path.join(root, file), 'utf8'));
    // These services do not participate in the model behavior tested here.
    window.MathJax = {startup: {promise: Promise.resolve()}, typesetClear() {}, typesetPromise: () => Promise.resolve()};
    window.Mousetrap = {bind() {}};
    window.item_json = {
        item_type: 'question', editable: true, current_stamp: {status: 'ok'},
        ability_frameworks: [], licences: [], taxonomies: [], access_rights: [],
        numbasExtensions: [], custom_part_types: [], itemJSON: {id: 1}, helpURL: ''
    };
    window.Editor = {};
    load('editor/static/js/jquery.js');
    window.$.holdReady(true);
    load('editor/static/js/jquery-ui.min.js');
    load('editor/static/js/knockout.js');
    window.Knockout = window.ko;
    load('editor/static/js/numbas/numbas-runtime.js');
    window.Numbas.queueScript('localisation-resources', ['i18next'], function() {
        window.Numbas.locale = {preferred_locale: 'en-GB', resources: {'en-gb': {translation:
            JSON.parse(fs.readFileSync(path.join(root, 'editor/static/js/numbas/locales/en-GB.json'), 'utf8'))
        }}};
    });
    load('editor/static/js/numbas/marking_scripts.js');
    window.Numbas.queueScript('base', [], function() {});
    await window.Numbas.awaitScripts(['jme', 'part', 'localisation', 'json', 'question', 'parts/numberentry', 'parts/patternmatch', 'marking_scripts']);
    window.Numbas.locale.init();
    load('editor/static/js/htmlparser.js');
    load('editor/static/js/main.js');
    load('editor/static/js/editor.js');
    load('editor/static/js/numbas/jme_function_hints.js');
    load('editor/static/js/question/part_types.js');
    load('editor/static/js/question/edit.js');
    const ready = new Promise(resolve => window.$(resolve));
    window.$.holdReady(false);
    await ready;
    // Keep the real models; bypass page binding and autosave for the empty test document.
    window.Editor.question.Question.prototype.loaded = function() {};
    return {window, close: () => window.close(), question: () => new window.Editor.question.Question()};
}

module.exports = {createEditor};
