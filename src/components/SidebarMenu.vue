<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateTo = (route: string) => {
  router.push(route);
};
</script>

<template>
  <div>
    <ul class="menu-list">
      <li v-for="(item, index) in Routers" @click="navigateTo(item.path)" v-tooltip.right="item.name" :key="index">
        <div :class="'menu-item ' + (item.path === $route.path ? ' active' : '')">
          <i :class="'pi ' + item.icon"></i>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
