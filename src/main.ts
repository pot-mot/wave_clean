import { createApp } from "vue";
import App from "./App.vue";

import './assets/theme.css'
import './assets/base.css'

import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"

import "vditor/dist/index.css";

const app = createApp(App)

app.mount("#app");
