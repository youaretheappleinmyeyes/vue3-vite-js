import './assets/main.css';


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


app.use(createPinia());
app.use(router);
app.use(vant);

app.mount('#app')
