Numbas.queueScript('scripts/editor-extras.js',['jme-display'],function() {
	Numbas.jme.display.texOps.subvar = function(thing,texArgs) {
		return '\\color{'+thing.args[1].tok.value+'}{'+texArgs[0]+'}';
	};
});
