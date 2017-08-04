    (function main() {

        rangy.init();

        const sheet = document.styleSheets[0];

        const editor = document.getElementById('spin-editor');
        const editorBorder = document.getElementById("spin-border");

        const wordCount = document.getElementById('wordCount');
        const unClosedTags = document.getElementById('unClosedTags');
        const generalErrors = document.getElementById('generalErrors');

        const editorToolbox = document.getElementById('editor-toolbox');

        const rotateColorButton = document.getElementById("rotateColor");
        let hueRotateVal = 0;

        const invertLuminButton = document.getElementById("invertLumin");
        let invertLuminToggle = false;

        const fontPlusButton = document.getElementById("fontPlus");
        const fontMinusButton = document.getElementById("fontMinus");
        let fontSizeAmt = 125;
        let lineHeightAmt = 30;
        let fontCounter = 8;

        const editorExtendButton = document.getElementById("editorExtend");
        let editorExtendBool = false;

        const getTextButton = document.getElementById("getText");
        const getPreviewButton = document.getElementById("getPreview");

        const advanced = [
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

        ];

        function syntaxHighlight(string, regexArray) {

            string = string.replace(/(<strong\s+class=\"syntax-highlight-[\w\-]+\s+syntax-highlight"\s*[\s\w\d\=\"\-\:\;\.]*>)+|(<\/strong>)+/g, '');
            string = string.replace(/(<span\s+style="font-size:\s[\d\.]+p[tx];">)((<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style="[a-zA-Z\-\:\;\d\s">\.]+\W<\/span>){0,1}[\[\]\.\w\s\t\d\!\@\#\$\%\&\_\-\:\;\'\"\?\,\{\}\|]+(<span\s+id="[a-zA-Z]+\_\d+\_\d+"\s+class="[a-zA-Z]+"\s+style="[a-zA-Z\-\:\;\d\s">\.]+\W<\/span>){0,1})(<\/span>)/g, '$2');

            // console.log('Cleaned');

            // console.log(string);

            for (let i = 0; i < regexArray.length; i++) {

                let patt = new RegExp(regexArray[i][3], regexArray[i][4]);

                // console.log('Process: ' + (i + 1) + '\n' + patt);

                if (patt.test(string)) {

                    // console.log('Match Sucessful, proceeding with Process: ' + (i + 1));

                    if (regexArray[i][0] === false) {
                        string = string.replace(patt, '<strong class="syntax-highlight-' + regexArray[i][2] + ' syntax-highlight">' + regexArray[i][7] + '</strong>');

                        // console.log("No insertion of unmatched before or after . . . ");

                    } else {

                        // console.log("insert unmatched text before or after . . . ?");

                        if (regexArray[i][1] === 'before') {

                            // console.log("BEFORE!");

                            string = string.replace(patt, regexArray[i][5] + '<strong class="syntax-highlight-' + regexArray[i][2] + ' syntax-highlight">' + regexArray[i][7] + '</strong>');

                        } else if (regexArray[i][1] === 'after') {

                            // console.log("AFTER!");

                            string = string.replace(patt, '<strong class="syntax-highlight-' + regexArray[i][2] + ' syntax-highlight">' + regexArray[i][7] + '</strong>' + regexArray[i][6]);

                        } else {

                            // console.log("BOTH!");

                            string = string.replace(patt, regexArray[i][5] + '<strong class="syntax-highlight-' + regexArray[i][2] + ' syntax-highlight">' + regexArray[i][7] + '</strong>' + regexArray[i][6]);

                        }

                    }

                    // console.log('Process: ' + (i + 1) + ' Completed!');
                    // console.log('Result for ' + regexArray[i][2]);
                    // console.log(string);

                } else {

                    // console.log('Match Failed, Halting for Process: ' + (i + 1));

                }

            }

            return string;
        }

        function checkTags(classNameOne, classNameTwo) {

            let classOneAmt = document.getElementsByClassName(classNameOne).length;
            let classTwoAmt = document.getElementsByClassName(classNameTwo).length;

            if ((classOneAmt / classTwoAmt) !== 1 && ((classOneAmt + classTwoAmt) % 2) !== 0) {
                return false;
            } else {
                return true;
            }
        }

        // Multiple events in js event listener
        function addEvents(element, eventList, func) {

            let event = eventList.split(', ');

            for (let i = 0; i < event.length; i++) {
                element.addEventListener(event[i], func);

            }
        }

        function editRule(stylesheet, rule, property, value) {
            let rules = stylesheet.cssRules || stylesheet.rules;
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
                } else {
                    stylesheet.insertRule(rule + ' { ' + property + ': ' + value + '; }');
                }
            }
        }

        addEvents(document, 'paste', (event) => {
            event.preventDefault();
            window.alert('Pasting');
        });

        addEvents(document, 'copy', (event) => {
            event.preventDefault();
            window.alert('Copying');
        });

        addEvents(document, 'cut', (event) => {
            event.preventDefault();
            window.alert('Cutting');
        });

        addEvents(editor, 'keyup', (event) => {

            let caretPos = rangy.saveSelection();

            event.target.innerHTML = syntaxHighlight(event.target.innerHTML, advanced);

            rangy.restoreSelection(caretPos);

        });

        addEvents(window, 'load, resize', (event) => {
            if (editorExtendBool === false) {
                editorToolbox.style.top = document.getElementById('spin-border').getBoundingClientRect().top;
            }
        });

        addEvents(rotateColorButton, 'click', (event) => {
            hueRotateVal += 20;
            document.querySelector("html").style.filter = "hue-rotate(" + hueRotateVal + "deg)";
        });

        addEvents(invertLuminButton, 'click', (event) => {
            if (invertLuminToggle === false) {
                event.target.classList.add('disabled');
                document.querySelector("body").style.filter = 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(130%)';
                invertLuminToggle = true;
            } else {
                event.target.classList.remove('disabled');
                document.querySelector("body").style.filter = 'invert(0%) hue-rotate(0deg) brightness(100%) contrast(100%)';
                invertLuminToggle = false;
            }
        });

        addEvents(fontPlusButton, 'click', (event) => {
            if (fontCounter < 16) {
                lineHeightAmt += 1.2;
                fontSizeAmt += 5;
                fontCounter++;
                editRule(sheet, '.spin-editor', 'line-height', lineHeightAmt + 'px');
                editRule(sheet, '.spin-editor', 'font-size', fontSizeAmt + '%');
                editRule(sheet, '.syntax-highlight', 'font-size', fontSizeAmt + '% !important');
            }
            if (fontCounter === 16) {
                event.target.classList.add('disabled');
            }
            if (fontMinusButton.classList.contains('disabled')) {
                fontMinusButton.classList.remove('disabled');
            }
        });

        addEvents(fontMinusButton, 'click', (event) => {
            if (fontCounter > 0) {
                lineHeightAmt -= 1.2;
                fontSizeAmt -= 5;
                fontCounter--;
                editRule(sheet, '.spin-editor', 'line-height', lineHeightAmt + 'px');
                editRule(sheet, '.spin-editor', 'font-size', fontSizeAmt + '%');
                editRule(sheet, '.syntax-highlight', 'font-size', fontSizeAmt + '% !important');
            }
            if (fontCounter === 0) {
                event.target.classList.add('disabled');
            }
            if (fontPlusButton.classList.contains('disabled')) {
                fontPlusButton.classList.remove('disabled');
            }
        });

        addEvents(editorExtendButton, 'click', (event) => {
            if (editorExtendBool === false) {
                event.target.classList.add('disabled');
                editor.style.overflowY = 'hidden';
                editor.style.height = 'auto';
                document.querySelector('.spin-container').style.padding = '3% 1% 4.5%'
                document.querySelector('.title').style.display = 'none';
                editorToolbox.style.top = document.getElementById('spin-border').getBoundingClientRect().top;
                editorExtendBool = true;
            } else {
                event.target.classList.remove('disabled');
                editor.style.overflowY = 'scroll';
                editor.style.height = '60%';
                document.querySelector('.spin-container').style.padding = '3% 5% 4.5%'
                document.querySelector('.title').style.display = 'block';
                editorToolbox.style.top = document.getElementById('spin-border').getBoundingClientRect().top;
                editorExtendBool = false;
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
        
        Its used in the syntaxHighlight function in the for loop.
        
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

