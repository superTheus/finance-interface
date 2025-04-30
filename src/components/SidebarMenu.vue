<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';

const router = useRouter();
const {logout} = useUserStore();

const navigateTo = (route: string) => {
  router.push(route);
};
</script>

<template>
  <div class="sidebar-menu">
    <ul class="menu-list">
      <li v-for="(item, index) in Routers" @click="navigateTo(item.path)" v-tooltip.right="item.name" :key="index">
        <div :class="'menu-item ' + (item.path === $route.path ? ' active' : '')">
          <i :class="'pi ' + item.icon"></i>
        </div>
      </li>
    </ul>

    <div class="foo">
      <Divider />

      <ul class="menu-list">
        <li @click="logout" v-tooltip.right="'Sair'">
          <div class="menu-item">
            <i class="pi pi-sign-out"></i>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
