import { createApp } from "vue";
import App from "./App.vue";

import './assets/theme.css'
import './assets/base.css'

import "@vue-flow/core/dist/style.css"
import "@vue-flow/core/dist/theme-default.css"

// polyfill
import "core-js/es/object/has-own.js"

const app = createApp(App)

app.mount("#app");
