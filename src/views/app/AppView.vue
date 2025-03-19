<script setup lang="ts">
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue';
import SidebarMenu from '@/components/SidebarMenu.vue';

const route = useRoute()

</script>

<template>
  <div class="container app-grid">
    <header class="header">
      <Header :current-page="String(route.name || '')" />
    </Header>

    <aside class="sidebar">
      <SidebarMenu />
    </aside>

    <main class="main-content">
      <router-view />
    </main>

  </div>
</template>
