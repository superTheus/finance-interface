import './assets/main.scss'
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css'


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import DialogService from 'primevue/dialogservice';

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    }
  }
});
app.use(DialogService);
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.mount('#app')
