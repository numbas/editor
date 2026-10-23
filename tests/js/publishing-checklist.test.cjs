const assert = require('node:assert/strict');
const test = require('node:test');
const {createEditor} = require('./editor.cjs');

test('Explore mode does not require a statement or worked solution', async t => {
    const editor = await createEditor();
    t.after(editor.close);
    const q = editor.question();
    const completed = q.task_list.section_completed;
    assert.equal(completed.statement(), false);
    assert.equal(completed.advice(), false);
    q.partsMode(q.partsModes.find(mode => mode.value === 'explore'));
    assert.equal(completed.statement(), true);
    assert.equal(completed.advice(), true);
    assert.equal(completed.settings(), false, 'Other publishing criteria still apply');
    q.partsMode(q.partsModes.find(mode => mode.value === 'all'));
    assert.equal(completed.statement(), false, 'Returning to all-parts mode restores the requirement');
    assert.equal(completed.advice(), false);
    q.statement('A question statement');
    q.advice('A worked solution');
    assert.equal(completed.statement(), true);
    assert.equal(completed.advice(), true);
});
