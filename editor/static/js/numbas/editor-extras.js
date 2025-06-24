Numbas.queueScript('base',[],function() {
});
Numbas.queueScript('display',[],function() {
});

Numbas.queueScript('editor-extras',['jme-display','localisation'],function() {
    Numbas.locale.set_preferred_locale('en-GB');
    Numbas.locale.init();
    Numbas.jme.display.texOps.subvar = function(thing,texArgs) {
        return '\\class{jme-subvar}{\\left\\{'+texArgs[0]+'\\right\\}}';
    };
});
