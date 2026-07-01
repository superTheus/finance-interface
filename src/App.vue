<script setup lang="ts">
import { DynamicDialog, Toast } from 'primevue';
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useConfigStore } from './stores/config';

const configSystem = useConfigStore();

onMounted(() => {
  if (configSystem.config?.darkMode) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }

  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true;

  document.documentElement.classList.toggle('pwa-standalone', isStandalone);
})

</script>

<template>
  <Toast position="bottom-right" />
  <ConfirmDialog />
  <DynamicDialog />
  <RouterView />
</template>

<style scoped></style>
