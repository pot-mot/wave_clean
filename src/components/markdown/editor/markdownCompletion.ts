// import "monaco-editor/esm/vs/basic-languages/markdown/markdown.js";
import {editor, languages, KeyCode, Range, Position} from "monaco-editor/esm/vs/editor/editor.api.js";
import OnEnterRule = languages.OnEnterRule;
import IAutoClosingPair = languages.IAutoClosingPair;
import IMonarchLanguageRule = languages.IMonarchLanguageRule;
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

const brackets: [string, string][] = []

const surroundingPairs: IAutoClosingPair[] = [
    {open: '{', close: '}'},
    {open: '[', close: ']'},
    {open: '(', close: ')'},
    {open: '<', close: '>'},
    {open: '`', close: '`'},
    {open: "'", close: "'"},
    {open: '"', close: '"'},
    {open: '*', close: '*'},
    {open: '_', close: '_'},
    {open: '=', close: '='},
    {open: '~', close: '~'},
    {open: '^', close: '^'},
    {open: '#', close: '#'},
    {open: '$', close: '$'},
    {open: '《', close: '》'},
    {open: '〈', close: '〉'},
    {open: '【', close: '】'},
    {open: '「', close: '」'},
    {open: '（', close: '）'},
    {open: '“', close: '”'},
]

const autoClosingPairs: IAutoClosingPair[] = [
    {open: '{', close: '}'},
    {open: '[', close: ']'},
    {open: '(', close: ')'},
    {open: '《', close: '》'},
    {open: '〈', close: '〉'},
    {open: '【', close: '】'},
    {open: '「', close: '」'},
    {open: '（', close: '）'},
]

const onEnterRules: OnEnterRule[] = []

const tokenizer: { [name: string]: IMonarchLanguageRule[] } = {
    root: [
        // markdown tables
        [/^\s*\|/, "@rematch", "@table_header"],
        // headers (with #)
        [/^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)((?:#+)?)/, ["white", "keyword", "keyword", "keyword"]],
        // headers (with =)
        [/^\s*(=+|\-+)\s*$/, "keyword"],
        // headers (with ***)
        [/^\s*((\*[ ]?)+)\s*$/, "meta.separator"],
        // quote
        [/^\s*>+/, "comment"],
        // list (starting with * or number)
        [/^\s*([\*\-+:]|\d+\.)\s/, "keyword"],
        // code block (4 spaces indent)
        [/^(\t|[ ]{4})[^ ].*$/, "string"],
        // code block (3 tilde)
        [/^\s*~~~\s*((?:\w|[\/\-#])+)?\s*$/, {token: "string", next: "@codeblock"}],
        // github style code blocks (with backticks and language)
        [
            /^\s*```\s*((?:\w|[\/\-#])+).*$/,
            {token: "string", next: "@codeblockgh", nextEmbedded: "$1"}
        ],
        // github style code blocks (with backticks but no language)
        [/^\s*```\s*$/, {token: "string", next: "@codeblock"}],
        // markup within lines
        {include: "@linecontent"}
    ],
    table_header: [
        {include: "@table_common"},
        [/[^\|]+/, "keyword.table.header"]
        // table header
    ],
    table_body: [{include: "@table_common"}, {include: "@linecontent"}],
    table_common: [
        [/\s*[\-:]+\s*/, {token: "keyword", switchTo: "table_body"}],
        // header-divider
        [/^\s*\|/, "keyword.table.left"],
        // opening |
        [/^\s*[^\|]/, "@rematch", "@pop"],
        // exiting
        [/^\s*$/, "@rematch", "@pop"],
        // exiting
        [
            /\|/,
            {
                cases: {
                    "@eos": "keyword.table.right",
                    // closing |
                    "@default": "keyword.table.middle"
                    // inner |
                }
            }
        ]
    ],
    codeblock: [
        [/^\s*~~~\s*$/, {token: "string", next: "@pop"}],
        [/^\s*```\s*$/, {token: "string", next: "@pop"}],
        [/.*$/, "variable.source"]
    ],
    // github style code blocks
    codeblockgh: [
        [/```\s*$/, {token: "string", next: "@pop", nextEmbedded: "@pop"}],
        [/[^`]+/, "variable.source"]
    ],
    linecontent: [
        // escapes
        [/&\w+;/, "string.escape"],
        [/@escapes/, "escape"],
        // various markup
        [/\b__([^\\_]|@escapes|_(?!_))+__\b/, "strong"],
        [/\*\*([^\\*]|@escapes|\*(?!\*))+\*\*/, "strong"],
        [/\b_[^_]+_\b/, "emphasis"],
        [/\*([^\\*]|@escapes)+\*/, "emphasis"],
        [/`([^\\`]|@escapes)+`/, "variable"],
        // links
        [/\{+[^}]+\}+/, "string.target"],
        [/(!?\[)((?:[^\]\\]|@escapes)*)(\]\([^\)]+\))/, ["string.link", "", "string.link"]],
        [/(!?\[)((?:[^\]\\]|@escapes)*)(\])/, "string.link"],
        // or html
        {include: "html"}
    ],
    // Note: it is tempting to rather switch to the real HTML mode instead of building our own here
    // but currently there is a limitation in Monarch that prevents us from doing it: The opening
    // '<' would start the HTML mode, however there is no way to jump 1 character back to let the
    // HTML mode also tokenize the opening angle bracket. Thus, even though we could jump to HTML,
    // we cannot correctly tokenize it in that mode yet.
    html: [
        // html tags
        [/<(\w+)\/>/, "tag"],
        [
            /<(\w+)(\-|\w)*/,
            {
                cases: {
                    "@empty": {token: "tag", next: "@tag.$1"},
                    "@default": {token: "tag", next: "@tag.$1"}
                }
            }
        ],
        [/<\/(\w+)(\-|\w)*\s*>/, {token: "tag"}],
        [/<!--/, "comment", "@comment"]
    ],
    comment: [
        [/[^<\-]+/, "comment.content"],
        [/-->/, "comment", "@pop"],
        [/<!--/, "comment.content.invalid"],
        [/[<\-]/, "comment.content"]
    ],
    // Almost full HTML tag matching, complete with embedded scripts & styles
    tag: [
        [/[ \t\r\n]+/, "white"],
        [
            /(type)(\s*=\s*)(")([^"]+)(")/,
            [
                "attribute.name.html",
                "delimiter.html",
                "string.html",
                {token: "string.html", switchTo: "@tag.$S2.$4"},
                "string.html"
            ]
        ],
        [
            /(type)(\s*=\s*)(')([^']+)(')/,
            [
                "attribute.name.html",
                "delimiter.html",
                "string.html",
                {token: "string.html", switchTo: "@tag.$S2.$4"},
                "string.html"
            ]
        ],
        [/(\w+)(\s*=\s*)("[^"]*"|'[^']*')/, ["attribute.name.html", "delimiter.html", "string.html"]],
        [/\w+/, "attribute.name.html"],
        [/\/>/, "tag", "@pop"],
        [
            />/,
            {
                cases: {
                    "$S2==style": {
                        token: "tag",
                        switchTo: "embeddedStyle",
                        nextEmbedded: "text/css"
                    },
                    "$S2==script": {
                        cases: {
                            $S3: {
                                token: "tag",
                                switchTo: "embeddedScript",
                                nextEmbedded: "$S3"
                            },
                            "@default": {
                                token: "tag",
                                switchTo: "embeddedScript",
                                nextEmbedded: "text/javascript"
                            }
                        }
                    },
                    "@default": {token: "tag", next: "@pop"}
                }
            }
        ]
    ],
    embeddedStyle: [
        [/[^<]+/, ""],
        [/<\/style\s*>/, {token: "@rematch", next: "@pop", nextEmbedded: "@pop"}],
        [/</, ""]
    ],
    embeddedScript: [
        [/[^<]+/, ""],
        [/<\/script\s*>/, {token: "@rematch", next: "@pop", nextEmbedded: "@pop"}],
        [/</, ""]
    ]
}

const markdownLanguage = {
    defaultToken: "",
    tokenPostfix: ".md",
    // escape codes
    control: /[\\`*_\[\]{}()#+\-\.!]/,
    noncontrol: /[^\\`*_\[\]{}()#+\-\.!]/,
    escapes: /\\(?:@control)/,
    // escape codes for javascript/CSS strings
    jsescapes: /\\(?:[btnfr\\"']|[0-7][0-7]?|[0-3][0-7]{2})/,
    // non matched elements
    empty: [
        "area",
        "base",
        "basefont",
        "br",
        "col",
        "frame",
        "hr",
        "img",
        "input",
        "isindex",
        "link",
        "meta",
        "param"
    ],
    tokenizer,
}

const initMonacoMarkdownLanguage = () => {
    languages.register({id: 'markdown'})

    languages.setMonarchTokensProvider('markdown', markdownLanguage)

    languages.setLanguageConfiguration('markdown', {
        surroundingPairs,
        brackets,
        autoClosingPairs,
        onEnterRules,
    })
}
initMonacoMarkdownLanguage()

type onEnterAppendTextOptions = {
    match: RegExpMatchArray,
    line: string,
    positionColumn: number,
    indent: string,
}

type onEnterCursorPositonOptions = {
    match: RegExpMatchArray,
    line: string,
    positionColumn: number,
    indent: string,
    appendText: string,
}

type onEnterAction = {
    // 匹配当前行的正则
    beforeText: RegExp
    // 生成新行内容的函数
    appendText: (options: onEnterAppendTextOptions) => string
    // 光标偏移位置，以初始缩进为准
    cursorPositionOffset?: (options: onEnterCursorPositonOptions) => {lineOffset: number; columnOffset: number}
}

const getIndent = (line: string): string => {
    const indentMatch = line.match(/^\s*/)
    return indentMatch ? indentMatch[0] : ''
}

const taskRegex = /^\[[xX ]] /

const lineEnterActions: onEnterAction[] = [
    // orderedList
    {
        beforeText: /^\s*(\d+)\. (.*)$/,
        appendText: ({match, indent}) => {
            const current = parseInt(match[1], 10)
            if (taskRegex.test(match[2])) {
                return `\n${indent}${current + 1}. [ ] `
            }
            return `\n${indent}${current + 1}. `
        },
    },

    // unorderedList
    {
        beforeText: /^\s*([-+*]) (.*)$/,
        appendText: ({match, indent}) => {
            if (taskRegex.test(match[2])) {
                return `\n${indent}${match[1]} [ ] `
            }
            return `\n${indent}${match[1]} `
        },
    },

    // reference
    {
        beforeText: /^\s*> .*$/,
        appendText: ({indent}) => {
            return `\n${indent}> `
        }
    }
]

export const initMonacoMarkdownEvent = (editor: IStandaloneCodeEditor) => {
    editor.onKeyDown((e) => {
        if (e.keyCode === KeyCode.Enter) {
            const model = editor.getModel()
            if (!model) return
            const position = editor.getPosition()
            if (!position) return
            const line = model.getLineContent(position.lineNumber)
            const lineBeforePosition = line.substring(0, position.column - 1)

            const matchedAction = lineEnterActions.find(rule => rule.beforeText.test(lineBeforePosition))

            if (matchedAction) {
                e.preventDefault()
                const indent = getIndent(line)
                const match = lineBeforePosition.match(matchedAction.beforeText)
                if (match) {
                    const appendText = matchedAction.appendText({
                        match,
                        line,
                        positionColumn: position.column,
                        indent
                    })
                    editor.executeEdits('enterAction', [
                        {
                            range: new Range(
                                position.lineNumber,
                                position.column,
                                position.lineNumber,
                                position.column
                            ),
                            text: appendText,
                            forceMoveMarkers: true
                        }
                    ])

                    if (matchedAction.cursorPositionOffset) {
                        const {lineOffset, columnOffset} = matchedAction.cursorPositionOffset({
                            match,
                            line,
                            positionColumn: position.column,
                            indent,
                            appendText
                        })
                        editor.setPosition(new Position(position.lineNumber + lineOffset, position.column + columnOffset))
                    }
                }
            }
        }
    })
}