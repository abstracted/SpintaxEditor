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
            this.containerNode = document.querySelector('.editor-container');
            this.wordCount = document.getElementById('editorWordCount');
            this.tagErrors = document.getElementById('editorTagErrors');
            this.keyWordWeight = document.getElementById('editorKeyWordWeight');

            this.timeout = null;

            this.debugMode = true;
            this.highlightMode = 'advanced';

            this.selection.init();
            this.toolbox.init();
            this.setContent(event);
            this.elementNode.focus();
            this.selection.setSelectAll();
            this.selection.setCollapsed();
        },
        highlightRules: {
            simple: [
                [true, 'before', 'curly-left-sentence', /(^([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*))(\{)/, 'gm', '$1', '', '$4'],

                [true, 'before', 'curly-left-sentence', /(<div>([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*))(\{)/, 'g', '$1', '', '$4'],

                [false, '', 'curly-right-sentence', /(\})(?!.*\})/, 'gm', '', '', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*)<\/div>)/, 'g', '', '$2', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*)<div>)/, 'g', '', '$2', '$1'],

                [true, 'before', 'curly-left-right-sentence', /([\.\?\!]{1})((<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}(\s|&nbsp;){1}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}\{)/, 'g', '$1', '', '$2'],

                [true, 'before', 'vert-sentence', /(\}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*[\?\.\!]{1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(\|)(?=[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*\{)/, 'g', '$1', '', '$4'],

                [true, 'before', 'words-wordspin', /(\{|\|)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=\||\})/, 'g', '$1', '', '$2'],

                [true, 'before', 'words-wordspin', /(\}|\|)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=\}|\|)/, 'g', '$1', '', '$2'],

                [true, 'before', 'words-wordspin', /(\{|\|)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=\{|\|)/, 'g', '$1', '', '$2'],
                [false, '', 'curly-left-wordspin', /(\{)(?!<\/strong>)/, 'g', '', '', '$1'],
                [false, '', 'curly-right-wordspin', /(\})(?!((<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}(\s|&nbsp;){1}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/spasn>){0,1}\{){0,1}(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}<\/strong>)/, 'g', '', '', '$1'],
                [false, '', 'vert-wordspin', /(\|)(?!<\/strong>)/, 'g', '', '', '$1'],
                [false, '', 'shortcode', /(\[[\s\w\=\-]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\s\w\=\-]*\])/, 'g', '', '', '$1'],
            ],
            advanced: [
                [true, 'before', 'curly-left-sentence', /(^([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*))(\{)/, 'gm', '$1', '', '$4'],

                [true, 'before', 'curly-left-sentence', /(<div>([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\}]*))(\{)/, 'g', '$1', '', '$4'],

                [false, '', 'curly-right-sentence', /(\})(?!.*\})/, 'gm', '', '', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*)<\/div>)/, 'g', '', '$2', '$1'],

                [true, 'after', 'curly-right-sentence', /(\})(?!<\/strong>)(([\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|\{]*)<div>)/, 'g', '', '$2', '$1'],

                [true, 'before', 'curly-right-wordspin', /(\|([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*))(\})/, 'g', '$1', '', '$4'],

                [true, 'after', 'curly-left-wordspin', /(\{)(([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)\|)/, 'g', '', '$2', '$1'],

		[true, 'before', 'words-wordspin', /(<strong\s+class=\"syntax-highlight-curly-left-wordspin\s+syntax-highlight\">\{<\/strong>)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=\|)/, 'g', '$1', '', '$2'],

		[true, 'before', 'words-wordspin', /(\|)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=<strong\s+class=\"syntax-highlight-curly-right-wordspin\s+syntax-highlight\">\})/, 'g', '$1', '', '$2'],

		[true, 'before', 'words-wordspin', /(\|)([\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(?=\|[\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/\|]*\})/, 'g', '$1', '', '$2'],

                [true, 'before', 'vert-wordspin', /(<\/strong>)(\|)(?=<strong\s+class=\"syntax-highlight-words-wordspin\ssyntax-highlight\">)/, 'g', '$1', '', '$2'],

                [true, 'before', 'vert-sentence', /(<strong\s+class=\"syntax-highlight-curly-right-wordspin\s+syntax-highlight\">\}<\/strong>[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*)(\|)(?=[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*(<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}[\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]*<strong\s+class=\"syntax-highlight-curly-left-wordspin\s+syntax-highlight\">{<\/strong>)/, 'g', '$1', '', '$3'],

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
            setSelectAll: function() {
                rangy.selectNodeContents(Editor.elementNode);
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
            max: 39,
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
                }
            },
            redo: function() {
                if (this.index < this.storage.caret.length - 1) {
                    this.index++;
                    this.restore();
                }
            }
        },
        toolbox: {
            init: function() {
                this.elementNode = document.getElementById('editorToolbox');
                this.colorButton = document.getElementById('editorColor');
                this.copyButton = document.getElementById('editorCopy');
                this.extendButton = document.getElementById('editorExtend');
                this.invertButton = document.getElementById('editorInvert');
                this.minusButton = document.getElementById('editorMinus');
                this.plusButton = document.getElementById('editorPlus');
                this.previewButton = document.getElementById('editorPreview');
                this.keywordButton = document.getElementById('editorKeyword');
                this.simpleButton = document.getElementById('editorSimple');

                this.previewContainer = document.getElementById('editorPreviewWindow');
                this.previewBorder = document.getElementById('editorPreviewBorder');
                this.previewNode = document.getElementById('editorPreviewContent');
                this.previewGenerate = document.getElementById('editorPreviewGenerate');

                this.keywordContainer = document.getElementById('editorKeywordWindow');
                this.keywordBorder = document.getElementById('editorKeywordBorder');
                this.keywordNode = document.getElementById('editorKeywordContent');
                this.keywordSaveButton = document.getElementById('editorKeywordSave');

                this.invertMode = false;
                this.colorRotateIndex = 0;
                this.extendMode = false;

                this.lineHeight = 30;
                this.fontSizeIndex = 8;
                this.fontSizeMax = this.fontSizeIndex * 2;
                this.fontSizeChangeAmt = 0.5;
                this.fontSizeTextArea = 14;
                this.fontSizeSyntaxDefault = 16;
                this.fontSizeSyntaxWords = 14;
                this.fontSizeSyntaxShortCode = 13;

                this.previewText = '';
                this.keywordText = '';

            },
            getPopUp: function(popupContainerClassName, buttonNode, popUpborderNode) {

                Env.setStyle(popupContainerClassName, 'display', 'flex');

                buttonNode.classList.add('disabled');
                popUpborderNode.classList.add('bounce-in');
                popUpborderNode.classList.remove('bounce-out');

                Env.setStyle('editor-overlay-container', 'filter', 'grayscale(70%) blur(3px)');
                Env.setStyle('editor-overlay-container', 'transform', 'scale(.85) perspective(950px) rotateY(5deg)');

                Env.setStyle('.env-root', 'overflow-y', 'hidden', 'class');

                // This looks a little nicer but its bad UX
                // if (this.extendMode === true) {
                //     this.setExtend();
                // }

            },
            getPopOut: function(popupContainerClassName, buttonNode, popUpborderNode) {
                setTimeout(() => {
                    Env.setStyle(popupContainerClassName, 'display', 'none');

                    Env.setStyle('.env-root', 'overflow-y', 'auto', 'class');

                    buttonNode.classList.remove('disabled');

                    Env.setStyle('editor-overlay-container', 'transform', 'none');

                }, 500);

                popUpborderNode.classList.add('bounce-out');

                popUpborderNode.classList.remove('bounce-in');

                Env.setStyle('editor-overlay-container', 'filter', 'grayscale(0%) blur(0px)');

                Env.setStyle('editor-overlay-container', 'transform', 'scale(1) perspective(0) rotateY(0deg)');

            },
            getPreview: function(option) {
                let spintaxText = Editor.elementNode.textContent;
                let matches, options, random;
                let regEx = new RegExp(/{([^{}]+?)}/);

                while ((matches = regEx.exec(spintaxText)) !== null) {
                    options = matches[1].split("|");
                    random = Math.floor(Math.random() * options.length);
                    spintaxText = spintaxText.replace(matches[0], options[random]);
                }

                this.previewText = spintaxText;


                if (option === 'open') {
                    this.getPopUp('editor-preview-container', this.previewButton, this.previewBorder);
                }
                if (option === 'close') {
                    this.getPopOut('editor-preview-container', this.previewButton, this.previewBorder);
                } else {
                    this.previewNode.innerHTML = this.previewText;
                }

            },
            getKeyword: function(option) {

                if (option === 'open') {
                    this.getPopUp('editor-keyword-container', this.keywordButton, this.keywordBorder);
                }
                if (option === 'close') {
                    this.getPopOut('editor-keyword-container', this.keywordButton, this.keywordBorder);
                    if (this.keywordNode.value) {
                        this.keywordText = this.keywordNode.value;
                    }
                    Editor.getKeywordWeight();
                }

            },
            setSimple: function() {
                if (Editor.highlightMode !== 'simple') {
                    Editor.highlightMode = 'simple';
                    this.simpleButton.classList.add('disabled');
                } else {
                    Editor.highlightMode = 'advanced';
                    this.simpleButton.classList.remove('disabled');
                }
                Editor.setContent();
            },
            setColor: function() {
                this.colorRotateIndex += 20;
                Env.setStyle(Env.rootNode.className, 'filter', "hue-rotate(" + this.colorRotateIndex + "deg) !important", 'class');
            },
            setInvert: function() {
                if (this.invertMode === false) {
                    this.invertButton.classList.add('disabled');
                    Env.setStyle(Env.bodyNode.className, 'filter', 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(130%)', 'class');
                    Env.setStyle('.syntax-highlight', 'filter', 'brightness(200%) saturate(5) contrast(150%) hue-rotate(-35deg)', 'class');
                    this.invertMode = true;
                } else {
                    this.invertButton.classList.remove('disabled');
                    Env.setStyle(Env.bodyNode.className, 'filter', 'invert(0%) hue-rotate(0deg) brightness(100%) contrast(100%)', 'class');
                    Env.setStyle('.syntax-highlight', 'filter', 'brightness(100%) saturate(1) contrast(100%) hue-rotate(0deg)', 'class');
                    this.invertMode = false;
                }
            },
            setPlus: function() {
                if (this.fontSizeIndex < this.fontSizeMax) {

                    this.lineHeight += 1.2;
                    this.fontSizeTextArea += this.fontSizeChangeAmt;
                    this.fontSizeSyntaxDefault += this.fontSizeChangeAmt;
                    this.fontSizeSyntaxWords += this.fontSizeChangeAmt;
                    this.fontSizeSyntaxShortCode += this.fontSizeChangeAmt;
                    this.fontSizeIndex++;
                    Env.setStyle('.editor-content', 'line-height', this.lineHeight + 'px', 'class');
                    Env.setStyle('.editor-content', 'font-size', this.fontSizeTextArea + 'pt', 'class');
                    Env.setStyle('.syntax-highlight', 'font-size', this.fontSizeSyntaxDefault + 'pt', 'class');
                    Env.setStyle('.syntax-highlight-words-wordspin', 'font-size', this.fontSizeSyntaxWords + 'pt', 'class');
                    Env.setStyle('.syntax-highlight-shortcode', 'font-size', this.fontSizeSyntaxShortCode + 'pt', 'class');
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
                    this.fontSizeTextArea -= this.fontSizeChangeAmt;
                    this.fontSizeSyntaxDefault -= this.fontSizeChangeAmt;
                    this.fontSizeSyntaxWords -= this.fontSizeChangeAmt;
                    this.fontSizeSyntaxShortCode -= this.fontSizeChangeAmt;
                    this.fontSizeIndex--;
                    Env.setStyle('.editor-content', 'line-height', this.lineHeight + 'px', 'class');
                    Env.setStyle('.editor-content', 'font-size', this.fontSizeTextArea + 'pt', 'class');
                    Env.setStyle('.syntax-highlight', 'font-size', this.fontSizeSyntaxDefault + 'pt', 'class');
                    Env.setStyle('.syntax-highlight-words-wordspin', 'font-size', this.fontSizeSyntaxWords + 'pt', 'class');
                    Env.setStyle('.syntax-highlight-shortcode', 'font-size', this.fontSizeSyntaxShortCode + 'pt', 'class');
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

                    Editor.elementNode.style.height = 'auto';


                    Env.setStyle(Editor.containerNode.className, 'padding', '3% 1% 4.5%', 'class');

                    this.elementNode.style.top = Editor.borderNode.getBoundingClientRect().top;

                    this.extendMode = true;
                } else {

                    this.extendButton.classList.remove('disabled');

                    Env.setStyle(Editor.elementNode.className, 'overflow-y', 'scroll', 'class');
                    Editor.elementNode.style.height = '60%';

                    Env.setStyle(Editor.containerNode.className, 'padding', '3% 5% 4.5%', 'class');

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
                this.toolbox.elementNode.style.top = this.borderNode.getBoundingClientRect().top;
            }
        },
        getTagErrors: function() {

            let classOneList = [
                '.syntax-highlight-curly-left-sentence',
                '.syntax-highlight-curly-left-wordspin'
            ];

            let classTwoList = [
                '.syntax-highlight-curly-right-sentence',
                '.syntax-highlight-curly-right-wordspin'
            ];

            let classOneAmt = 0;
            let classTwoAmt = 0;
            let errorAmt = 0;


            for (var i = classOneList.length - 1; i >= 0; i--) {
                if (document.querySelectorAll(classOneList[i])) {
                    classOneAmt += document.querySelectorAll(classOneList[i]).length;
                }
            }

            for (var i = classTwoList.length - 1; i >= 0; i--) {
                if (document.querySelectorAll(classTwoList[i])) {
                    classTwoAmt += document.querySelectorAll(classTwoList[i]).length;
                }
            }

            if (classOneAmt !== classTwoAmt) {
                if (classOneAmt > classTwoAmt) {
                    errorAmt += (classOneAmt - classTwoAmt);
                } else {
                    errorAmt += (classTwoAmt - classOneAmt);
                }
            }

            if (document.querySelectorAll('.syntax-highlight-error')) {
                errorAmt += document.querySelectorAll('.syntax-highlight-error').length;
            }
            if (errorAmt !== 0) {
                this.tagErrors.innerHTML = errorAmt + ' errors*';
            } else {
                this.tagErrors.innerHTML = 'nothing yet';
            }

        },
        getWordCount: function() {
            this.toolbox.getPreview();

            let wc = this.toolbox.previewNode.textContent.replace(/\s{2,}/g).match(/\w+/g);

            if (wc !== null) {
                this.wordCount.innerHTML = wc.length + ' words*';
            } else {
                this.wordCount.innerHTML = 'nothing yet';
            }

        },
        getKeywordWeight: function() {

            let edContent = this.elementNode.textContent;
            let keyword = this.toolbox.keywordText;

            if (edContent.length === 0 || !edContent &&  keyword.length === 0 || !keyword) {
                this.keyWordWeight.innerHTML = 'nothing yet';
            } else {
                let stringCount = edContent.match((/[a-z-'\w]+/gi) || []).length;
                let substringCount = (edContent.match(new RegExp(keyword, 'gi')) || []).length;
                let percent = ((substringCount / stringCount) * 100).toFixed(2);
                if (percent < 0.5 || percent > 2.5) {
                    let lowHigh = (percent < 0.5) ? 'low' : 'high';
                    this.keyWordWeight.innerHTML = percent + '%, too ' + lowHigh + ', ';
                } else {
                    this.keyWordWeight.innerHTML = percent + '%, ';
                }
                let singularPlural = (substringCount <= 1) ? 'time' : 'times';
                this.keyWordWeight.innerHTML += substringCount + ' ' + singularPlural;
            }
        },
        keyDownHandler: function(event) {
            if (event.ctrlKey) {
                if (this.history.ctrlKey === false && this.history.modifyKey === false) {

                    this.history.ctrlKey = true;

                    if (event.shiftKey === false && event.ctrlKey && event.key.toUpperCase() === 'Z') {
                        this.history.undo();
                        this.history.modifyKey = true;
                    }
                    if (event.shiftKey === true && event.ctrlKey && event.key.toUpperCase() === 'Z') {
                        this.history.redo();
                        this.history.modifyKey = true;
                    }
                    if (event.ctrlKey && event.key.toUpperCase() === 'Y') {
                        this.history.redo();
                        this.history.modifyKey = true;
                    }
                }
            }

            if (this.history.modifyKey === true && this.history.ctrlKey === false) {
                this.history.modifyKey = false;
            } else if (this.history.modifyKey === false && this.history.ctrlKey === true) {
                this.history.ctrlKey = false;
            }
        },
        keyupHandler: function(event) {
            if (event.key.toUpperCase() !== 'CONTROL') {
                if (this.history.ctrlKey === false && this.history.modifyKey === false) {

                    this.selection.setCaret();

                    this.setContent();

                    this.selection.getCaret();

                    clearTimeout(this.timeout);
                    this.timeout = setTimeout(() => {
                        let caret = rangy.saveSelection();
                        this.history.save(this.getClean(this.elementNode.innerHTML), caret)
                        rangy.removeMarkers(caret);

                        this.getTagErrors();
                        this.getWordCount();
                        this.getKeywordWeight();

                    }, 600);
                }
            }

            this.history.ctrlKey = false;
            this.history.modifyKey = false;
        }
    };

    /*---------------------------------------------------------------------------------*/

    window.addEventListener('load', (event) => {

        Env.init();

        Editor.init(event);

        Editor.getResize();

        clearTimeout(Editor.timeout);

        Editor.timeout = setTimeout(() => {
            let caret = rangy.saveSelection();
            Editor.history.save(Editor.getClean(Editor.elementNode.innerHTML), caret)
            rangy.removeMarkers(caret);
        }, 400);

        function addEvents(element, eventList, func) {
            let event = eventList.split(', ');

            for (let i = 0; i < event.length; i++) {
                element.addEventListener(event[i], func);
            }
        }

        addEvents(document, 'dragstart, drop', (event) => {
            event.preventDefault();
            event.stopPropagation();

            return false;
        });

        addEvents(document, 'copy, cut, paste', (event) => {
            Editor.clipboard(event);
        });

        window.addEventListener('resize', (event) => {
            Editor.getResize();
        });

        document.addEventListener('keydown', (event) => {
            if (event.target.getAttribute('id') === Editor.elementNode.getAttribute('id')) {
                Editor.keyDownHandler(event);
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.target.getAttribute('id') === Editor.elementNode.getAttribute('id')) {
                Editor.keyupHandler(event);
            }
        });

        document.addEventListener('click', (event) => {
            switch (event.target.getAttribute("id")) {
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
                case 'editorPreview':
                    Editor.toolbox.getPreview('open');
                    break;
                case 'editorPreviewClose':
                    Editor.toolbox.getPreview('close');
                    break;
                case 'editorPreviewGenerate':
                    Editor.toolbox.getPreview();
                    break;
                case 'editorKeyword':
                    Editor.toolbox.getKeyword('open');
                    break;
                case 'editorKeywordSave':
                    Editor.toolbox.getKeyword('close');
                    break;
                case 'editorSimple':
                    Editor.toolbox.setSimple();
                    break;
                default:
                    event.preventDefault();
                    event.stopPropagation();
                    break;
            }
        });

        Editor.toolbox.previewGenerate.addEventListener('mouseenter', (event) => {
            event.target.firstChild.style.animationPlayState = 'running';
        });

        Editor.toolbox.previewGenerate.addEventListener('mouseleave', (event) => {
            event.target.firstChild.style.animationPlayState = 'paused';
        });

    });

})();

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
            - [\[\]\.\!\@\#\$\%\&\_\-\=\:\;\'\"\?\,\*\(\)\w\s\t\d]
        - General Characters with HTML tags: matches words and html, should only be used for word spins
            - [\[\]\.\!\@\#\$\%\&\_\-\:\;\'\"\?\,\*\(\)\w\s\t\d\<\>\-\=\/]       
        - Caret Position: Matches the caret position marker
            -  (<span\s+id=\"[a-zA-Z]+\_\d+\_\d+\"\s+class=\"[a-zA-Z]+\"\s+style=\"[a-zA-Z\-\:\;\d\s\.]+\">\W<\/span>){0,1}
	    
	Fix character matching
	\\\[\]\.\,\;\'\"\:\?\~\!\@\#\$\%\^\&\*\(\)\_\+\-\`\d\w\s
	\\\[\]\.\,\;\'\"\:\?\~\!\@\#\$\%\^\&\*\(\)\_\+\-\`\d\w\s\>\<\=\/\
	\\\[\]\.\,\;\'\"\:\?\~\!\@\#\$\%\^\&\*\(\)\_\+\-\`\d\w\s\>\<\=\/\|\}\{

-------------------------------------------------------------------------------------*/
