ELM_SRC=$(wildcard src/*.elm)

all: question_editor

question_editor: dist/question-editor.js

dist/question-editor.js: src/QuestionEditor.elm $(ELM_SRC)
	elm make $< --output=$@
	cp $@ ../editor/static/js/question/edit_elm.js

q:
	@echo $(ELM_SRC)
