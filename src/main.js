import './assets/css/main.css';


import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

import vant from 'vant';
import 'vant/lib/index.css';

//页面三分组建（自定义） 上下固定 中部自适应
import tcb from './components/layout/tcb/index.vue'
app.component('tcb',tcb);
// 引入Font Awesome
// import '@fortawesome/font-awesome-free/css/all.min.css';
// // 引入Font Awesome
// import 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
// // 引入Tailwind CSS
// import 'https://cdn.tailwindcss.com'

app.use(createPinia());
app.use(router);
app.use(vant);

app.mount('#app')
