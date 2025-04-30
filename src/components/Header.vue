<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import { useUserStore } from '@/stores/user';
import { useConfigStore } from '@/stores/config';
import { useDialog } from 'primevue/usedialog';

import Config from './Config.vue';
import MobileMenu from './MobileMenu.vue';

const props = defineProps<{ currentPage: string | null }>()

const user = useUserStore();
const config = useConfigStore();
const dialog = useDialog();

const visibleConfig = ref(false);
const visibleMenu = ref(false);

</script>

<template>
  <div class="header-title">
    <div class="title">
      <p class="sutitle"> {{ props.currentPage }} </p>
      <p> Bem vindo {{ user.user?.nome.split(" ")[0] }} 😉 </p>
    </div>

    <div class="actions">
      <Button :icon="config.config.darkMode ? 'pi pi-moon' : 'pi pi-sun'" aria-label="Dark Mode" class="btn"
        @click="config.changeTheme" v-tooltip.left="config.config.darkMode ? 'Tema claro' : 'Tema escuro'" />
      <Button icon="pi pi-cog" aria-label="Dark Mode" class="btn" v-tooltip.left="'Configurações'"
        @click="visibleConfig = !visibleConfig" />
    </div>

    <div class="btn-menu">
      <Button icon="pi pi-bars" aria-label="Menu" class="btn" v-tooltip.left="'Menu'" @click="visibleMenu = !visibleMenu" />
    </div>
  </div>

  <Drawer v-model:visible="visibleConfig" header="Configurações" position="right">
    <Config />
  </Drawer>

  <Drawer v-model:visible="visibleMenu" header="Menu" position="right">
    <MobileMenu @close="visibleMenu = false" />
  </Drawer>

</template>

<style scoped lang="scss">
.header-title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  height: 4rem;
  background-color: var(--surface-a);
  border-bottom: solid 1px var(--surface-b);

  .title {
    font-size: 1.3rem;

    .sutitle {
      font-size: 1.1rem;
    }
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  .btn-menu {
    display: none;
  }
}
</style>
