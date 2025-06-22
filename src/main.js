import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router.js";
import { createPinia } from "pinia";
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const pinia = createPinia();

createApp(App)
  .use(router)
  .use(pinia)
  .mount("#app");
