const assert = require('node:assert/strict');
const test = require('node:test');
const {createEditor} = require('./editor.cjs');

async function mark(editor, typeName, answer, configure) {
    const q = editor.question();
    const p = q.addPart(q.partTypes().find(type => type.name === typeName));
    configure(p[typeName]);
    q.questionScope(q.baseScope());
    const mt = p.marking_test();
    mt.variablesReady(true);
    mt.answer({valid: true, value: answer});
    await mt.run(true);
    assert.equal(mt.last_run().error, undefined, 'The real marking algorithm ran successfully');
    return {q, p, mt};
}

test('A new unit test describes the answer and the actual marking result', async t => {
    const editor = await createEditor();
    t.after(editor.close);
    const number = model => {model.minValue('1'); model.maxValue('1');};
    for(const [answer, expected] of [['1', '"1" is marked correct'], ['2', '"2" is marked incorrect']]) {
        const {p, mt} = await mark(editor, 'numberentry', answer, number);
        p.addUnitTest(mt);
        assert.equal(mt.name(), expected);
        assert.equal(p.unit_tests()[0], mt);
        assert.notEqual(p.marking_test(), mt, 'The fresh draft test is still created');
    }
    const {p, mt} = await mark(editor, 'patternmatch', 'HELLO', model => {
        model.answer('hello');
        model.caseSensitive(true);
        model.partialCredit(50);
    });
    assert.equal(mt.last_run().credit, 0.5);
    p.addUnitTest(mt);
    assert.equal(mt.name(), '"HELLO" is marked partially correct');
});

test('A supplied unit test name is preserved', async t => {
    const editor = await createEditor();
    t.after(editor.close);
    const {p, mt} = await mark(editor, 'numberentry', '1', model => {model.minValue('1'); model.maxValue('1');});
    mt.name('Boundary case');
    p.addUnitTest(mt);
    assert.equal(mt.name(), 'Boundary case');
});
