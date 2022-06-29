# Location of the Numbas runtime repository
NUMBAS_RUNTIME_PATH ?= ../compiler

NUMBAS_SCRIPT_DIR = editor/static/js/numbas

update_scripts: update_from_runtime update_from_docs

# Update the Numbas runtime, scripts and localisation files
update_from_runtime: runtime marking_scripts diagnostic_scripts locales extensions

# Update the JME function hints from the documentation
update_from_docs: jme_function_hints

SCRIPTS_DIR = runtime/scripts
RUNTIME_SOURCES = numbas.js jme.js jme-builtins.js jme-display.js jme-rules.js jme-variables.js jme-calculus.js localisation.js part.js question.js schedule.js diagnostic.js marking.js math.js util.js i18next/i18next.js json.js es5-shim.js es6-shim.js es6-promise/es6-promise.js decimal/decimal.js evaluate-settings.js
PART_SOURCES = $(patsubst $(NUMBAS_RUNTIME_PATH)/%, %, $(wildcard $(NUMBAS_RUNTIME_PATH)/$(SCRIPTS_DIR)/parts/*.js))
THEME_DIR = themes/default/files/scripts
THEME_SOURCES = answer-widgets.js
ALL_SOURCES = $(patsubst %, $(SCRIPTS_DIR)/%, $(RUNTIME_SOURCES)) $(patsubst %, $(THEME_DIR)/%, $(THEME_SOURCES)) $(PART_SOURCES)

EXTENSIONS_DIR = $(NUMBAS_RUNTIME_PATH)/extensions
EXTENSIONS = $(foreach f,$(shell find $(EXTENSIONS_DIR) -maxdepth 1 -mindepth 1 -type d 2> /dev/null),$(notdir $(f:%/=%)))

# Copy extension files over from the Numbas runtime
extensions: $(foreach f,$(EXTENSIONS),$(NUMBAS_SCRIPT_DIR)/extensions/$(f))

$(NUMBAS_SCRIPT_DIR)/extensions/%: $(EXTENSIONS_DIR)/%/*
	@mkdir -p $@
	@cp -r $(EXTENSIONS_DIR)/$*/* $@
	@touch $@
	@echo "Copied extension $*"

define created
@echo -e "\e[32m✓ Created $@\e[0m"
endef

# Collate all the Numbas runtime scripts
$(NUMBAS_SCRIPT_DIR)/numbas-runtime.js: $(patsubst %, $(NUMBAS_RUNTIME_PATH)/%, $(ALL_SOURCES))
	@echo "// Compiled using $(ALL_SOURCES)" > $@
	@printf "// From the Numbas compiler directory\n" >> $@
	@for p in $^; do cat $$p >> $@; echo "" >> $@; done
	$(created)

runtime: $(NUMBAS_SCRIPT_DIR)/numbas-runtime.js

MARKING_SCRIPTS=$(wildcard $(NUMBAS_RUNTIME_PATH)/marking_scripts/*.jme)

define MARKING_INTRO
Numbas.queueScript('marking_scripts',['marking'],function() {
    Numbas.raw_marking_scripts = {
endef
define MARKING_END

    };
});
endef
export MARKING_INTRO
export MARKING_END

define encode_marking
echo "        \"$(notdir $(basename $(f)))\": " >> $@; cat $(f) | python -c 'import json,sys; sys.stdout.write(json.dumps(sys.stdin.read()))' >> $@;
endef

# Collect the built-in part marking scripts from the Numbas runtime repository
$(NUMBAS_SCRIPT_DIR)/marking_scripts.js: $(MARKING_SCRIPTS)
	@echo "$$MARKING_INTRO" > $@
	@$(foreach f,$(wordlist 1,1,$^),$(encode_marking))
	@$(foreach f,$(wordlist 2,$(words $^),$^),printf ",\n" >> $@;$(encode_marking))
	@echo "$$MARKING_END" >> $@
	$(created)

marking_scripts: $(NUMBAS_SCRIPT_DIR)/marking_scripts.js


DIAGNOSTIC_SCRIPTS=$(wildcard $(NUMBAS_RUNTIME_PATH)/diagnostic_scripts/*.jme)

define DIAGNOSTIC_INTRO
Numbas.queueScript('diagnostic_scripts',[],function() {
    Numbas.raw_diagnostic_scripts = {
endef
define DIAGNOSTIC_END

	};
});
endef
export DIAGNOSTIC_INTRO
export DIAGNOSTIC_END

define encode_diagnostic
echo "        \"$(notdir $(basename $(f)))\": " >> $@; cat $(f) | python -c 'import json,sys; sys.stdout.write(json.dumps(sys.stdin.read()))' >> $@;
endef

$(NUMBAS_SCRIPT_DIR)/diagnostic_scripts.js: $(DIAGNOSTIC_SCRIPTS)
	@echo "$$DIAGNOSTIC_INTRO" > $@
	@$(foreach f,$(wordlist 1,1,$^),$(encode_diagnostic))
	@$(foreach f,$(wordlist 2,$(words $^),$^),printf ",\n" >> $@;$(encode_diagnostic))
	@echo "$$DIAGNOSTIC_END" >> $@
	$(created)

diagnostic_scripts: $(NUMBAS_SCRIPT_DIR)/diagnostic_scripts.js

LOCALES=$(wildcard $(NUMBAS_RUNTIME_PATH)/locales/*.json)
EDITOR_LOCALES=$(patsubst $(NUMBAS_RUNTIME_PATH)/locales/%,$(NUMBAS_SCRIPT_DIR)/locales/%,$(LOCALES))

# Copy localisation files from the Numbas runtime
$(EDITOR_LOCALES): $(NUMBAS_SCRIPT_DIR)/locales/%: $(NUMBAS_RUNTIME_PATH)/locales/%
	cp $< $@

locales: $(EDITOR_LOCALES)

# Wrap the Makefile for the documentation
# use `make docs_html` to make the HTML version of the docs
docs_%:
	$(MAKE) -f docs.mk $*

check_help_links:
	@python check_help_links.py

editor/static/js/numbas/jme_function_hints.js: $(wildcard docs/**/*.rst)
	@echo "var jme_function_hints = " > $@
	@python make_jme_reference_data.py >> $@
	@echo ";" >> $@
	$(created)

jme_function_hints: editor/static/js/numbas/jme_function_hints.js
