/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_TARGET_RUNTIME: 'browser' | 'tauri' | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}