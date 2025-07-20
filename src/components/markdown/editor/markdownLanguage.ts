// import "monaco-editor/esm/vs/basic-languages/markdown/markdown.js";
import {languages} from "monaco-editor/esm/vs/editor/editor.api.js";
import IMonarchLanguage = languages.IMonarchLanguage
import LanguageConfiguration = languages.LanguageConfiguration
import {markdownCharCompletionProvider} from "@/components/markdown/editor/completion/charCompletion.ts";
import {markdownFoldingRangeProvider} from "@/components/markdown/editor/folding/markdownFolding.ts";
import {markdownCodeLanguageCompletionProvider} from "@/components/markdown/editor/completion/codeLanguageCompletion.ts";
import {markdownKatexCompletionProvider} from "@/components/markdown/editor/completion/katexCompletion.ts";

const markdownLanguage: IMonarchLanguage = {
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
    tokenizer: {
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
            // code blocks (with backticks but no language)
            [/^\s*```\s*$/, {token: "string", next: "@codeblock"}],
            [/^\s*~~~\s*$/, {token: "string", next: "@codeblock"}],
            // code blocks (wait language)
            [/^\s*~~~/, {token: "string", next: "@codeblockLanguage"}],
            [/^\s*```/, {token: "string", next: "@codeblockLanguage"}],
            // katex block
            [/^\s*\$\$.*$/, {token: "string", next: "@katexblock"}],
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
            // [/.*$/, "variable.source"]
        ],
        codeblockLanguage: [
            [/\s*((?:\w|[\/\-#])+).*$/, {token: "keyword", next: "codeblockWithLanguage", nextEmbedded: "$1"}]
        ],
        // github style code blocks
        codeblockWithLanguage: [
            [/~~~\s*$/, {token: "string", next: "@pop", nextEmbedded: "@pop"}],
            [/```\s*$/, {token: "string", next: "@pop", nextEmbedded: "@pop"}],
            // [/[^~]+/, "variable.source"],
            // [/[^`]+/, "variable.source"]
        ],
        katexblock: [
            [/^\s*\$\$.*$/, {token: "string", next: "@pop"}],
            // [/[^\$]+/, "variable.source"]
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
            // highlight mark
            [/==([^\\_]|@escapes|_(?!_))+==/, "strong"],
            // inline code
            [/`([^\\`]|@escapes)+`/, "variable"],
            // inline katex
            [/\$([^\\`]|@escapes)+\$/, "variable"],
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
    },
}

const markdownConfig: LanguageConfiguration = {
    brackets: [
        ["(", ")"],
        ["[", "]"],
        ["{", "}"],
        ["（", "）"],
        ["【", "】"],
        ["〈", "〉"],
        ["《", "》"],
    ],
    autoClosingPairs: [
        {open: '{', close: '}'},
        {open: '[', close: ']'},
        {open: '(', close: ')'},
        {open: '（', close: '）'},
        {open: '【', close: '】'},

        {open: '<', close: '>'},
        {open: '〈', close: '〉'},
        {open: '《', close: '》'},

        {open: '\'', close: '\''},
        {open: '"', close: '"'},
        {open: '‘', close: '’'},
        {open: '“', close: '”'},
        {open: "「", close: "」"},
        {open: "『", close: "』"},
    ],
    surroundingPairs: [
        {open: '{', close: '}'},
        {open: '[', close: ']'},
        {open: '(', close: ')'},
        {open: '（', close: '）'},
        {open: '【', close: '】'},

        {open: '<', close: '>'},
        {open: '〈', close: '〉'},
        {open: '《', close: '》'},

        {open: '\'', close: '\''},
        {open: '"', close: '"'},
        {open: '‘', close: '’'},
        {open: '“', close: '”'},
        {open: "「", close: "」"},
        {open: "『", close: "』"},

        {open: '*', close: '*'},
        {open: '_', close: '_'},
        {open: '=', close: '='},
        {open: '~', close: '~'},
        {open: '^', close: '^'},
        {open: '$', close: '$'},
    ],
    onEnterRules: [],
    folding: {},
    comments: {
        blockComment: ['<!--', '-->']
    },
}

export const initMonacoMarkdownLanguage = () => {
    languages.register({id: 'markdown'})

    languages.setMonarchTokensProvider('markdown', markdownLanguage)

    languages.setLanguageConfiguration('markdown', markdownConfig)

    languages.registerFoldingRangeProvider('markdown', markdownFoldingRangeProvider)

    languages.registerCompletionItemProvider('markdown', markdownCharCompletionProvider)
    languages.registerCompletionItemProvider('markdown', markdownCodeLanguageCompletionProvider)
    languages.registerCompletionItemProvider('markdown', markdownKatexCompletionProvider)
}
