const assert = require('node:assert/strict');
const test = require('node:test');
const {createEditor} = require('./editor.cjs');

test('Selecting a part type clears the search for the next part, gap or step', async t => {
    const editor = await createEditor();
    t.after(editor.close);
    const q = editor.question();
    const type = q.partTypes().find(type => type.name === 'numberentry');
    q.part_search('number');
    const parent = q.addPart(type);
    assert.equal(parent.type().name, 'numberentry');
    assert.equal(q.part_search(), '');
    q.startAddingPart();
    assert.equal(q.filtered_part_types().length, q.partTypes().length, 'The reopened picker shows every type');
    for(const [kind, list, availableTypes] of [
        ['gap', parent.gaps, q.gapTypes], ['step', parent.steps, q.stepTypes]
    ]) {
        q.addingPart({kind, parent, parentList: list, availableTypes});
        q.part_search('number');
        const child = q.addPart(type);
        assert.equal(child.type().name, 'numberentry');
        assert.equal(list()[0], child);
        assert.equal(q.currentPart(), child);
        assert.equal(q.part_search(), '', `${kind} selection clears the shared search`);
    }
});
