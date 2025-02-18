import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AppView from '@/views/app/AppView.vue'
import DashboardView from '@/views/app/Dashboard/DashboardView.vue';
import { Routers } from '@/constants/routers';

function isAuthenticated() {
  return !!sessionStorage.getItem('user');
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      beforeEnter: (to, from, next) => {
        if (isAuthenticated()) {
          next('/app');
        } else {
          next();
        }
      }
    },
    {
      path: '/app',
      name: 'app',
      component: AppView,
      redirect: '/app/dashboards',
      children: Routers,
      beforeEnter: (to, from, next) => {
        if (!isAuthenticated()) {
          next('/');
        } else {
          next();
        }
      }
    }
  ],
})

export default router
