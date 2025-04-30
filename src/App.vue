<script setup lang="ts">
import { config } from 'dotenv';
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
})

</script>

<template>
  <Toast position="bottom-right" />
  <ConfirmDialog />
  <DynamicDialog />
  <RouterView />
</template>

<style scoped></style>
