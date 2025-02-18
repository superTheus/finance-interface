<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import { useUserStore } from '@/stores/user';
import { useConfigStore } from '@/stores/config';
import { useDialog } from 'primevue/usedialog';
import DynamicDialog from 'primevue/dynamicdialog';

import Config from './Config.vue';

const props = defineProps<{ currentPage: string | null }>()

const user = useUserStore();
const config = useConfigStore();
const isDarkMode = ref(config.config?.darkMode);
const dialog = useDialog();

const changeTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }

  config.setConfig({
    ...config.config,
    darkMode: isDarkMode.value
  });
};

const openConfig = () => {
  dialog.open(Config, {
    props: {
      header: 'Configurações de usuário',
      style: {
        width: '50vw',
        height: '100vh',
        margin: '0',
        maxHeight: 'none'
      },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
      modal: true,
      position: 'right',
      dismissableMask: true
    }
  });
}

</script>

<template>
  <div>
    <h4> {{ props.currentPage }} </h4>
    <h2> Bem vindo {{ user.user?.nome }} 😉 </h2>
  </div>
  <div class="flex gap-1">
    <Button :icon="isDarkMode ? 'pi pi-moon' : 'pi pi-sun'" aria-label="Dark Mode" class="btn" @click="changeTheme"
      v-tooltip="isDarkMode ? 'Tema claro' : 'Tema escuro'" />
    <Button icon="pi pi-cog" aria-label="Dark Mode" class="btn" v-tooltip="'Configurações'" @click="openConfig" />
  </div>
</template>

<style scoped></style>
