# AGENTS.md

## 常用命令

- `pnpm dev` — Vite 开发服务器（默认 Tauri 模式）
- `pnpm dev-browser` — Vite 开发服务器（浏览器模式）
- `pnpm test` — 运行 vitest（`vitest run`）
- `pnpm type-check` — `vue-tsc --build --force`
- `pnpm lint:prettier` — 用 Prettier 格式化 `src/`
- `pnpm build` — type-check + vite build（Tauri 模式）
- `pnpm build-for-browser` — type-check + vite build（浏览器模式）
- `pnpm tauri-desktop` — Tauri 桌面开发
- `pnpm tauri-desktop-build` — Tauri 桌面发布构建

**仅限 pnpm。** 本项目使用 `pnpm`（锁文件：`pnpm-lock.yaml`），请勿使用 npm 或 yarn。

## 构建模式

两种运行时目标，通过环境文件控制：
- **`.env.tauri`** → `VITE_TARGET_RUNTIME=tauri`（桌面/移动端，完整文件系统 + 剪贴板权限）
- **`.env.browser`** → `VITE_TARGET_RUNTIME=browser`（Web 部署，应用 Gzip 压缩）

默认的 `pnpm dev` / `pnpm build` 运行在 Tauri 模式下。Web 部署请使用 `*-browser` 变体。

## 架构

- **前端：** Vue 3（组合式 API，`<script setup>`）+ Vite + TypeScript
- **后端：** Rust 项目位于 `src-tauri/` — Tauri 2.x，插件：fs、clipboard、dialog、os、opener
- **非 monorepo。** 根目录一个前端 package，`src-tauri/` 一个 Rust crate。

### 关键目录

| 路径 | 用途 |
|------|------|
| `src/mindMap/` | 核心思维导图逻辑：节点、连线、图层、历史、导出、工具栏 |
| `src/mindMap/useMindMap.ts` | 主 composable，连接思维导图各模块 |
| `src/mindMap/MindMapData.ts` | 数据类型与 JSON Schema |
| `src/store/mindMapStore.ts` | 思维导图 CRUD + 持久化 |
| `src/components/markdown/` | 基于 VNode 的自定义 Markdown 渲染器 + Monaco 编辑器 |
| `src/i18n/` | 自定义类型化国际化（默认 `zh-cn`，支持 `en`） |
| `src-tauri/src/lib.rs` | Tauri 应用构建 + 插件注册 |
| `src-tauri/src/desktop/before_exit.rs` | 桌面关闭守卫流程 |

## 数据存储

- 所有数据均为本地 JSON 文件，通过 `@tauri-apps/plugin-fs` 读写（非 IndexedDB，非服务器）。
- 元文件 `[[WAVE_CLEAN_EDIT_META]]` 存储思维导图索引、主题、语言、快捷输入。
- 单个思维导图存储为 `MindMap-{uuid}` JSON 文件。
- **AJV** 在读取/解析前校验所有 JSON — Schema 定义在 `src/mindMap/MindMapData.ts`。

## Markdown 渲染

自定义 VNode 渲染管线 — **不产生** HTML 字符串。`src/components/markdown/preview/` 将 markdown-it token 转换为 Vue VNode。Monaco 编辑器处理编辑，支持自定义补全、代码折叠、触屏选择，以及 mermaid/katex 语言支持。

## 图层（非嵌套节点）

思维导图使用**图层**系统进行分组，而非传统的嵌套树节点。图层具有可见性/锁定控制；所有数据均携带图层 ID。

## 测试

- **Vitest** + `jsdom` 环境。测试文件与源码同目录，放在 `__tests__/` 中。
- 现有测试较少 — 仅一个测试文件：`src/mindMap/helperLines/gap/__tests__/gapCalc.test.ts`。
- 运行全部测试：`pnpm test`。运行单个测试文件：`pnpm vitest run <path>`。

## 预提交钩子

Husky 在提交时运行：`lint-staged`（对暂存文件执行 Prettier）→ `pnpm type-check` → `pnpm test`。

## 规范

### 类型系统

1. **严格类型** — 禁止使用 `any`，启用 `noUnusedLocals`、`noUnusedParameters`。

2. **`null`/`undefined`** — 优先使用 `undefined`，严格区分两者，禁止 `==`/`!=`，一律用 `===`/`!==`。

3. **`readonly`** — 尽可能使用 `const` 显式声明常量，针对类型，尽可能使用 `DeepReadonly`。

4. **禁止不安全类型断言** — 严禁使用 `as any`、`as unknown as Xxx` 等旁路类型系统的不安全转换。安全的 `as` 用法仅限：
   - `as const` 常量断言
   - DOM 事件目标窄化（`e.target as HTMLElement`、`e.target as Node`）
   - material 窄化（需配合 `instanceof` 守卫）
   - `JSON.parse()` 返回 `as unknown`（用于给校验层，但不得裸用 `as Xxx`）
   - **判别式 Map 访问** — 当 `Map<Key, BaseType>` 的值在运行时是不同类型的子类，可通过泛型映射类型配合 `as` 做一次集中窄化。

5. **两阶段初始化** — 禁止使用 `undefined as unknown as Xxx` 在对象字面量中占位再覆盖属性。若工厂函数无法在构造阶段提供完整对象，应将返回类型定为 `Omit<FullType, 'panel'>`，由调用方通过 `{ ...partial, panel: createPanel(partial) }` 组装为完整类型。

6. **枚举** — 禁止使用 `enum`，使用常量 + 索引类型推导：
   ```ts
   const EnumType_CONTANTS = ['A', 'B'] as const
   type EnumType = typeof EnumType_CONTANTS[number]
   ```

### 代码风格

1. **缩进** — 4 个空格。

2. **函数风格** — 拒绝非必要的 `class`、`function` 声明、`this`，尽可能使用 `const` 箭头函数，包括导出函数。

3. **注释语言** — 所有注释必须使用中文。

4. **代码格式** — Prettier 配置（`.prettierrc.js`）：4 空格缩进、单引号、分号、尾随逗号、LF 换行。

## Tauri 桌面关闭守卫

当桌面窗口关闭时，Rust 后端发出 `before-exit` 事件。前端必须在窗口实际关闭前回复 `confirm-close-response`。详见 `src-tauri/src/desktop/before_exit.rs`。

## 无 CI/CD

项目没有 GitHub Actions、CI 工作流或云部署流水线。质量检查仅通过本地预提交钩子执行。
