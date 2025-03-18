import './assets/main.scss'
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import definePrimeVue from './plugins/prime';

const app = createApp(App)

app.use(createPinia())
app.use(router);
definePrimeVue(app)
app.mount('#app')
