(function main() {

    const Env = {
        init: function() {
            this.sheet = document.styleSheets[0];
            this.rootNode = document.querySelector(".env-root");
            this.bodyNode = document.querySelector(".env-body");
        },
        setStyle: function(rule, property, value, type) {
            let rules = this.sheet.cssRules || this.sheet.rules;
            let regex = new RegExp(property + ':\\s*[a-zA-Z\\s\\d\\.\\_\\-(),%]+(?=\;)', 'i');
            for (ruleIndex in rules) {
                if (typeof rules[ruleIndex].selectorText != 'undefined') {
                    if (rules[ruleIndex].selectorText.match(rule, 'i')) {
                        if (rules[ruleIndex].style.cssText.match(property, 'i')) {
                            rules[ruleIndex].style.cssText = rules[ruleIndex].style.cssText.replace(regex, property + ':' + value);
                        } else {
                            rules[ruleIndex].style.cssText += ' ' + property + ': ' + value + ';';
                        }
                        break;
                    }
                } else if (typeof type != 'undefined') {
                    if (type === 'class' && !rule.match(/\./g) && !rule.match(/\#/g)) rule = '.' + rule;
                    if (type === 'id' && !rule.match(/\#/g) && !rule.match(/\./g)) rule = '#' + rule;
                    this.sheet.insertRule(rule + ' { ' + property + ': ' + value + '; }', rules.length);
                    break;
                }
            }
        }
    };

    const Editor = {
        init: function(event) {
            this.elementNode = document.getElementById('editorContent');
            this.borderNode = document.getElementById("editorBorder");
            this.wordCount = document.getElementById('editorWordCount');
            this.tagErrors = document.getElementById('editorTagErrors');

            this.containerNode = document.querySelector('.editor-container');
            this.titleNode = document.querySelector('.editor-title');

            this.timeout = null;

            this.debugMode = false;
            this.highlightMode = 'advanced';

            this.selection.init();
            this.toolbox.init();
            this.setContent(event);
            this.elementNode.focus();
        },
        highlightRules: {
            simple: [],
            advanced: [
                [true, 'before', 'curly-left-sentence', /(^([\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*))(\{)/, 'gm', '$1', '', '$4'],

                [true, 'before', 'curly-left-sentence', /(<div>([\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*))(\{)/, 'g', '$1', '', '$4'],

                [false, '', 'curly-right-sentence', /(\})(?!.*\})/, 'gm', '', '', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\|\{\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\|\{\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*)<\/div>)/, 'g', '', '$2', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\|\{\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\|\{\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*)<div>)/, 'g', '', '$2', '$1'],

                [true, 'before', 'curly-right-wordspin', /(\|([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*))(\})/, 'g', '$1', '', '$4'],

                [true, 'after', 'curly-left-wordspin', /(\{)(([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*)\|)/, 'g', '', '$2', '$1'],

                [true, 'both', 'words-wordspin', /(<strong\s+class=\"syntax-highlight-curly-left-wordspin\s+syntax-highlight\">\{<\/strong>)([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*)(\|)/, 'g', '$1', '$4', '$2'],

                [true, 'both', 'words-wordspin', /(\|)([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*)(<strong\s+class=\"syntax-highlight-curly-right-wordspin\s+syntax-highlight\">\})/, 'g', '$1', '$4', '$2'],

                [true, 'before', 'words-wordspin', /(\|)([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*)(?=\|[\[\|\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\=\/]*<strong\s+class=\"syntax-highlight-curly-right-wordspin\ssyntax-highlight\">\})/, 'g', '$1', '', '$2'],

                [true, 'before', 'vert-wordspin', /(<\/strong>)(\|)(?=<strong\s+class=\"syntax-highlight-words-wordspin\ssyntax-highlight\">)/, 'g', '$1', '', '$2'],

                [true, 'before', 'vert-sentence', /(<strong\s+class=\"syntax-highlight-curly-right-wordspin\s+syntax-highlight\">\}<\/strong>[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*)(\|)(?=[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]*<strong\s+class=\"syntax-highlight-curly-left-wordspin\s+syntax-highlight\">{<\/strong>)/, 'g', '$1', '', '$3'],

                [false, '', 'shortcode', /(\[[\s\w\=\-]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\s\w\=\-]*\])/, 'g', '', '', '$1'],

                [false, '', 'curly-left-right-sentence', /(\}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}&nbsp;(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\{)/, 'g', '', '', '$1'],

                [false, '', 'curly-left-right-sentence', /(\}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\s(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\{)/, 'g', '', '', '$1'],

                [false, '', 'error', /(\})(?!(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}(&nbsp;|\s){0,1}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\{{0,1}<\/strong>)/, 'g', '', '', '$1'],

                [false, '', 'error', /(\{)(?!<\/strong>)/, 'g', '', '', '$1'],

                [false, '', 'error', /(\|)(?!<\/strong>)/, 'g', '', '', '$1']

            ]
        },
        selection: {
            init: function() {
                rangy.init();
                this.caretPos = null;
            },
            setCollapsed: function() {
                rangy.getSelection().collapseToEnd();
            },
            setCaret: function() {
                this.caretPos = rangy.saveSelection();
            },
            getCaret: function(caretPos) {
                if (caretPos) {
                    rangy.restoreSelection(caretPos);
                } else {
                    rangy.restoreSelection(this.caretPos);
                }
            }
        },
        history: {
            index: 0,
            max: 9,
            storage: {
                content: [ /*HTML CONTENT*/ ],
                caret: [ /*CARET POSITION*/ ],
            },
            modifyKey: false,
            ctrlKey: false,
            restore: function() {
                Editor.elementNode.innerHTML = this.storage.content[this.index];
                Editor.setContent();
                Editor.selection.getCaret(this.storage.caret[this.index]);
            },
            clean: function() {
                this.storage.content.shift();
                this.storage.caret.shift();
                this.index--;
            },
            save: function(content, caret) {
                if (this.storage.content.length > this.max) {
                    this.clean();
                }
                this.index++;
                this.storage.content[this.index] = content;
                this.storage.caret[this.index] = caret;
            },
            undo: function() {
                if (this.index > 1) {
                    this.index--;
                    this.restore();
                    console.log('undo')

                }
            },
            redo: function() {
                if (this.index < this.storage.caret.length - 1) {
                    this.index++;
                    this.restore();
                    console.log('redo')
                }
            }
        },
        toolbox: {
            init: function() {
                this.elementNode = document.getElementById('editorToolbox');

                this.colorButton = document.getElementById('editorColor');
                this.copyButton = document.getElementById('editorCopy');
                this.extendButton = document.getElementById('editorExtend');
                this.helpButton = document.getElementById('editorHelp');
                this.invertButton = document.getElementById('editorInvert');
                this.minusButton = document.getElementById('editorMinus');
                this.plusButton = document.getElementById('editorPlus');
                this.previewButton = document.getElementById('editorPreview');
                this.simpleButton = document.getElementById('editorSimple');

                this.colorRotateIndex = 0;
                this.extendMode = false;
                this.fontSizeAmt = 125;
                this.fontSizeIndex = 8;
                this.fontSizeMax = this.fontSizeIndex * 2;
                this.invertMode = false;
                this.lineHeight = 30;
            },
            getCopy: function() {

            },
            getPreview: function() {

            },
            setHelp: function() {

            },
            setSimple: function() {

            },
            setColor: function() {
                this.colorRotateIndex += 20;
                Env.setStyle(Env.rootNode.className, 'filter', "hue-rotate(" + this.colorRotateIndex + "deg) !important", 'class');
            },
            setInvert: function() {
                if (this.invertMode === false) {
                    this.invertButton.classList.add('disabled');
                    Env.setStyle(Env.bodyNode.className, 'filter', 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(130%)', 'class');
                    this.invertMode = true;
                } else {
                    this.invertButton.classList.remove('disabled');
                    Env.setStyle(Env.bodyNode.className, 'filter', 'invert(0%) hue-rotate(0deg) brightness(100%) contrast(100%)', 'class');
                    this.invertMode = false;
                }
            },
            setPlus: function() {
                if (this.fontSizeIndex < this.fontSizeMax) {
                    this.lineHeight += 1.2;
                    this.fontSizeAmt += 5;
                    this.fontSizeIndex++;

                    Env.setStyle(Editor.elementNode.className, 'line-height', this.lineHeight + 'px', 'class');
                    Env.setStyle(Editor.elementNode.className, 'font-size', this.fontSizeAmt + '%', 'class');
                    Env.setStyle('syntax-highlight', 'font-size', this.fontSizeAmt + '% !important');

                }

                if (this.fontSizeIndex === this.fontSizeMax) {
                    this.plusButton.classList.add('disabled');
                }

                if (this.minusButton.classList.contains('disabled')) {
                    this.minusButton.classList.remove('disabled');
                }

            },
            setMinus: function() {
                if (this.fontSizeIndex > 0) {
                    this.lineHeight -= 1.2;
                    this.fontSizeAmt -= 5;
                    this.fontSizeIndex--;

                    Env.setStyle(Editor.elementNode.className, 'line-height', this.lineHeight + 'px', 'class');
                    Env.setStyle(Editor.elementNode.className, 'font-size', this.fontSizeAmt + '%', 'class');
                    Env.setStyle('syntax-highlight', 'font-size', this.fontSizeAmt + '% !important');
                }

                if (this.fontSizeIndex === 0) {
                    this.minusButton.classList.add('disabled');
                }

                if (this.plusButton.classList.contains('disabled')) {
                    this.plusButton.classList.remove('disabled');
                }

            },
            setExtend: function() {
                if (this.extendMode === false) {

                    this.extendButton.classList.add('disabled');

                    Env.setStyle(Editor.elementNode.className, 'overflow-y', 'hidden', 'class');
                    Env.setStyle(Editor.elementNode.className, 'height', 'auto', 'class');

                    Env.setStyle(Editor.containerNode.className, 'padding', '3% 1% 4.5%', 'class');
                    Env.setStyle(Editor.titleNode.className, 'display', 'none', 'class');

                    this.elementNode.style.top = Editor.borderNode.getBoundingClientRect().top;

                    this.extendMode = true;
                } else {

                    this.extendButton.classList.remove('disabled');

                    Env.setStyle(Editor.elementNode.className, 'overflow-y', 'scroll', 'class');
                    Env.setStyle(Editor.elementNode.className, 'height', '60%');

                    Env.setStyle(Editor.containerNode.className, 'padding', '3% 5% 4.5%', 'class');
                    Env.setStyle(Editor.titleNode.className, 'display', 'block', 'class');

                    this.elementNode.style.top = Editor.borderNode.getBoundingClientRect().top;

                    this.extendMode = false;
                }
            }
        },
        clipboard: function(clipboardEvent) {

            this.selection.setCaret();

            let clipboardData = clipboardEvent.clipboardData || window.clipboardData;
            this.elementNode.innerHTML = this.getClean(this.elementNode.innerHTML);
            let selectedText = '';

            if (this.elementNode.innerHTML.match(/([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]*<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){1}([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]+)(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]*)/)) {

                selectedText = this.elementNode.innerHTML.replace(/([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]*<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){1}([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]+)(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/\{\}\|]*)/, '$2');

            }

            switch (clipboardEvent.type) {
                case 'copy':
                    if (selectedText.length !== 0) clipboardData.setData('text/plain', selectedText);
                    break;
                case 'cut':
                    if (selectedText.length !== 0) clipboardData.setData('text/plain', selectedText);
                    this.elementNode.innerHTML = this.elementNode.innerHTML.replace('</span>' + selectedText, '</span>');
                    break;
                case 'paste':
                    if (selectedText.length === 0) {
                        this.elementNode.innerHTML = this.elementNode.innerHTML.replace(/(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>)/i, clipboardData.getData('text/plain') + '$1');
                    } else {
                        this.elementNode.innerHTML = this.elementNode.innerHTML.replace('</span>' + selectedText, '</span>' + clipboardData.getData('text/plain'));
                    }
                    break;
            }

            clipboardEvent.preventDefault();

            this.setContent();

            this.selection.getCaret();
            this.selection.setCollapsed();
        },
        setContent: function() {
            if (this.highlightMode === 'advanced') {
                this.elementNode.innerHTML = this.getHighlight(this.elementNode.innerHTML, this.highlightRules.advanced, this.debugMode);
            } else if (this.highlightMode === 'simple') {
                this.elementNode.innerHTML = this.getHighlight(this.elementNode.innerHTML, this.highlightRules.simple, this.debugMode);
            }
        },
        getClean: function(string) {
            string = string.replace(/(<strong\s+class=\"syntax-highlight-[\w\-]+\s+syntax-highlight"\s*[\s\w\d\=\"\-\:\;\.]*>)+|(<\/strong>)+/g, '');
            string = string.replace(/(<span\s+style="font-size:\s[\d\.]+p[tx];">)((<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style="[a-zA-Z\-\:\;\d\s">\.]+\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\{\}\|]+(<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style="[a-zA-Z\-\:\;\d\s">\.]+\W<\/span>){0,1})(<\/span>)/g, '$2');
            return string;
        },
        getHighlight: function(string, syntaxArray, debug) {

            string = this.getClean(string);

            if (debug) console.log('Cleaned');

            if (debug) console.log(string);

            for (let i = 0; i < syntaxArray.length; i++) {

                let patt = new RegExp(syntaxArray[i][3], syntaxArray[i][4]);

                if (debug) console.log('Process: ' + (i + 1) + '\n' + patt);

                if (patt.test(string)) {

                    if (debug) console.log('Match Sucessful, proceeding with Process: ' + (i + 1));

                    if (syntaxArray[i][0] === false) {
                        string = string.replace(patt, '<strong class="syntax-highlight-' + syntaxArray[i][2] + ' syntax-highlight">' + syntaxArray[i][7] + '</strong>');

                        if (debug) console.log("No insertion of unmatched before or after . . . ");

                    } else {

                        if (debug) console.log("insert unmatched text before or after . . . ?");

                        if (syntaxArray[i][1] === 'before') {

                            if (debug) console.log("BEFORE!");

                            string = string.replace(patt, syntaxArray[i][5] + '<strong class="syntax-highlight-' + syntaxArray[i][2] + ' syntax-highlight">' + syntaxArray[i][7] + '</strong>');

                        } else if (syntaxArray[i][1] === 'after') {

                            if (debug) console.log("AFTER!");

                            string = string.replace(patt, '<strong class="syntax-highlight-' + syntaxArray[i][2] + ' syntax-highlight">' + syntaxArray[i][7] + '</strong>' + syntaxArray[i][6]);

                        } else {

                            if (debug) console.log("BOTH!");

                            string = string.replace(patt, syntaxArray[i][5] + '<strong class="syntax-highlight-' + syntaxArray[i][2] + ' syntax-highlight">' + syntaxArray[i][7] + '</strong>' + syntaxArray[i][6]);

                        }

                    }

                    if (debug) console.log('Process: ' + (i + 1) + ' Completed!');
                    if (debug) console.log('Result for ' + syntaxArray[i][2]);
                    if (debug) console.log(string);

                } else {

                    if (debug) console.log('Match Failed, Halting for Process: ' + (i + 1));

                }

            }
            return string;
        },
        getResize: function() {
            if (this.toolbox.extendMode === false) {
                this.toolbox.elementNode.style.top = this.elementNode.getBoundingClientRect().top;
            }
        },
        getTagErrors: function(classNameOne, classNameTwo) {

            let classOneAmt = document.getElementsByClassName(classNameOne).length;
            let classTwoAmt = document.getElementsByClassName(classNameTwo).length;

            return ((classOneAmt / classTwoAmt) !== 1 && ((classOneAmt + classTwoAmt) % 2) !== 0);
        },
        getWordCount: function() {

        }
    };

    /*---------------------------------------------------------------------------------*/

    function setEvent(element, eventList, func) {
        let event = eventList.split(', ');

        for (let i = 0; i < event.length; i++) {
            element.addEventListener(event[i], func);
        }
    }

    setEvent(window, 'load, resize', (event) => {
        switch (event.type) {
            case 'load':
                Env.init();
                Editor.init(event);
                clearTimeout(Editor.timeout);
                Editor.timeout = setTimeout(() => {
                    let caret = rangy.saveSelection();
                    Editor.history.save(Editor.getClean(Editor.elementNode.innerHTML), caret)
                    rangy.removeMarkers(caret);
                }, 400);
            default:
                Editor.getResize();
                break;
        }
    });

    setEvent(document, 'dragstart, drop, contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return false;
    });

    setEvent(document, 'copy, cut, paste', (event) => {
        Editor.clipboard(event);
    });

    setEvent(document, 'keydown', (event) => {
        if (event.ctrlKey) {
            if (Editor.history.ctrlKey === false && Editor.history.modifyKey === false) {
                console.log(event.type + ' ' + event.key)
                Editor.history.ctrlKey = true;
                if (event.shiftKey === false && event.ctrlKey && event.key.toUpperCase() === 'Z') {
                    Editor.history.undo();
                    Editor.history.modifyKey = true;
                }
                if (event.shiftKey === true && event.ctrlKey && event.key.toUpperCase() === 'Z') {
                    Editor.history.redo();
                    Editor.history.modifyKey = true;
                }
                if (event.ctrlKey && event.key.toUpperCase() === 'Y') {
                    Editor.history.redo();
                    Editor.history.modifyKey = true;
                }
                console.log('CTRL Key ' + Editor.history.ctrlKey);
                console.log('MODIFIER Key ' + Editor.history.modifyKey);
            }
        }

        if (Editor.history.modifyKey === true && Editor.history.ctrlKey === false) {
            Editor.history.modifyKey = false;
        } else if (Editor.history.modifyKey === false && Editor.history.ctrlKey === true) {
            Editor.history.ctrlKey = false;
        }

    });

    setEvent(document, 'keyup', (event) => {
        if (event.key.toUpperCase() !== 'CONTROL') {
            if (Editor.history.ctrlKey === false && Editor.history.modifyKey === false) {
                console.log(event.type + ' ' + event.key);

                Editor.selection.setCaret();

                Editor.setContent();

                Editor.selection.getCaret();

                clearTimeout(Editor.timeout);
                Editor.timeout = setTimeout(() => {
                    let caret = rangy.saveSelection();
                    Editor.history.save(Editor.getClean(Editor.elementNode.innerHTML), caret)
                    rangy.removeMarkers(caret);
                    console.log('history added')
                    console.log(Editor.history.index);
                    console.log(Editor.history.storage);
                }, 600);
            }
        }

        Editor.history.ctrlKey = false;
        Editor.history.modifyKey = false;

    });

    setEvent(document, 'click', (event) => {
        switch (event.target.getAttribute("id")) {
            case 'editorHelp':

                break;
            case 'editorColor':
                Editor.toolbox.setColor();
                break;
            case 'editorInvert':
                Editor.toolbox.setInvert();
                break;
            case 'editorPlus':
                Editor.toolbox.setPlus();
                break;
            case 'editorMinus':
                Editor.toolbox.setMinus();
                break;
            case 'editorExtend':
                Editor.toolbox.setExtend();
                break;
            case 'editorCopy':

                break;
            case 'editorPreview':

                break;
            case 'editorSimple':

                break;
            default:
                event.preventDefault();
                event.stopPropagation();
                break;
        }
    });

})();






// Spintax Renderer
//https://ctrlq.org/code/20277-javascript-spintax
// var text = "{{Hello|Hi|Hola}, How {have you been|are you doing}? " +
//            "Take care. {{Thanks and|Best} Regards|Cheers|Thanks}";
// var matches, options, random;
// var regEx = new RegExp(/{([^{}]+?)}/);
// while((matches = regEx.exec(text)) !== null) {
//   options = matches[1].split("|");
//   random = Math.floor(Math.random() * options.length);
//   text = text.replace(matches[0], options[random]);
// }
// console.log(text);

/* -----------------------------------------------------------------------------------
        
        Note: The spintax arrays
        
        Its used in the getHighlight function
        
        Here's what each element is for:
        0: Does the regex require groups to be inserted before or after the match
        1: If the last was true, where to insert the other groups
            - before, insert group before match
            - after, insert group after match
            - both, insert group before and after match
        2: The class to apply to the matched text
        3: The regex match, please be sure to include the capture groups
        4: Flags to be used with the regex match, g, m, gm
        5: The capture group for content to be inserted Before
            - does not apply if 1: is false
            - does not apply if 2: is 'after'
        6: The capture group for content to be inserted After 
            - does not apply if 1: is false
            - does not apply if 2: is 'before'
        7: The matched capture group, this is the content that gets wrapped for styling
        
        Base Rules to get you started:
        
        - General Charcters: Just matches words
            - [\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,]
        - General Characters with HTML tags: matches words and html, should only be used for word spins
            - [\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]
        - General Characters, With Vert and Right Curly: For begin of para spins
            - [\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]
        - General Characters, With Vert and Left Curly: For end of para spins
            - [\|\{\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]
        
        - Caret Position: Matches the caret position marker
            -  (<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}
 
        - Mixed, matches the cursor position and general characters
            - ([\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*(<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style="[a-zA-Z\-\:\;\d\s">\.]+\W<\/span>){0,1}[\|\}\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\<\>\-\=\/]*)
            
-------------------------------------------------------------------------------------*/