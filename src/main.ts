import { createApp } from "vue";
import App from "./App.vue";

import './assets/theme.css'
import './assets/base.css'

import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"
import "@vue-flow/node-resizer/dist/style.css"

import 'md-editor-v3/lib/style.css';

const app = createApp(App)

app.mount("#app");
