import './assets/main.scss'
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import moment from 'moment'
import 'moment/locale/pt-br'

import App from './App.vue'
import router from './router'
import definePrimeVue from './plugins/prime';

moment.locale('pt-br')

const app = createApp(App)

app.use(createPinia())
app.use(router);
definePrimeVue(app)
app.mount('#app')
