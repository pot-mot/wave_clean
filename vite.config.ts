import {defineConfig, PluginOption} from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from '@vitejs/plugin-vue-jsx'
import {fileURLToPath, URL} from "node:url";
import {prismjsPlugin} from "vite-plugin-prismjs"
import compressPlugin from "vite-plugin-compression"

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async (env) => {
    const shouldCompress = env.mode === "browser";

    const plugins: PluginOption[] = [
        vue(),
        vueJsx(),
        prismjsPlugin({
            languages: [
                'javascript', 'js', 'jsx', 'typescript', 'ts', "tsx",
                'css', 'css-extras', 'html', 'less', 'sass', 'scss',
                'svg', 'icon',
                'markup', "markdown", "md",
                'http', 'uri', 'url',
                'c', 'cpp', 'cmake', 'objc',
                'rust',
                'go',
                'php', 'phpdoc',
                'perl',
                'java', 'javadoc', 'groovy', 'kotlin', 'kt', 'kts', 'scala',
                'latex', 'tex', 'matlab',
                'sql', 'graphql', 'mongodb',
                'erlang',
                'lua',
                'python', 'py', 'django', 'jinja2',
                'csharp', 'dotnet',
                'cobol',
                'makefile',
                'mermaid',
                'json', 'json5', 'jsonp',
                'xml', 'yaml', 'yml', 'ini', 'toml',
                'bash', 'shell', 'batch',
                'docker', 'dockerfile',
                'git',
                'vim',
                'dns-zone',
                'log',
                'qml',
                'scheme',
                'swift'
            ],
            'plugins': ['inline-color'],
            css: true
        }),
    ]

    if (shouldCompress) {
        plugins.push(compressPlugin({
            filter: /\.(js|css|json|txt|ico|svg)(\?.*)?$/i, // 需要压缩的文件
            threshold: 1024, // 文件容量大于这个值进行压缩
            algorithm: 'gzip', // 压缩方式
            ext: 'gz', // 后缀名
            deleteOriginFile: true, // 压缩后是否删除压缩源文件
        }))
    }

    return {
        plugins,

        // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
        //
        // 1. prevent vite from obscuring rust errors
        clearScreen: false,
        // 2. tauri expects a fixed port, fail if that port is not available
        server: {
            port: 1420,
            strictPort: true,
            host: host || false,
            hmr: host
                ? {
                    protocol: "ws",
                    host,
                    port: 1421,
                }
                : undefined,
            watch: {
                // 3. tell vite to ignore watching `src-tauri`
                ignored: ["**/src-tauri/**"],
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vue': ['vue'],
                        'vue-flow': ['@vue-flow/core', '@vue-flow/node-toolbar'],
                        'lodash': ['lodash-es'],
                        'monaco-editor': ['monaco-editor'],
                        'prismjs': ['prismjs'],
                        'markdown-it': ['markdown-it', 'markdown-it-emoji', 'markdown-it-mark', 'markdown-it-multimd-table', 'markdown-it-sub', 'markdown-it-sup', 'markdown-it-task-lists'],
                        'mermaid': ['mermaid'],
                        'katex': ['katex'],
                        'image-viewer': ['v-viewer', 'viewerjs'],
                        'html-to-image': ['html-to-image'],
                    }
                }
            }
        }
    }
});
