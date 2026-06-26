<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConfigStore } from '@/stores/config';
import Config from './Config.vue';
import MobileMenu from './MobileMenu.vue';
import logoDark from '@/assets/images/logos/logo_dark_alternative.png';
import logoLight from '@/assets/images/logos/logo_light_alternative.png';

const props = defineProps<{ currentPage: string | null }>();

const config = useConfigStore();
const visibleConfig = ref(false);
const visibleMenu = ref(false);
const brandLogo = computed(() => (config.config.darkMode ? logoDark : logoLight));
</script>

<template>
  <div class="header-title orbit-panel">
    <div class="title">
      <img :src="brandLogo" alt="Orbitus" class="mobile-logo" />
      <h1>{{ props.currentPage }}</h1>
    </div>

    <div class="actions">
      <Button
        :icon="config.config.darkMode ? 'pi pi-moon' : 'pi pi-sun'"
        aria-label="Alternar tema"
        class="topbar-button"
        severity="secondary"
        text
        rounded
        @click="config.changeTheme"
      />
      <Button
        icon="pi pi-cog"
        aria-label="Configuracoes"
        class="topbar-button"
        severity="secondary"
        text
        rounded
        @click="visibleConfig = !visibleConfig"
      />
    </div>

    <div class="btn-menu">
      <Button
        icon="pi pi-bars"
        aria-label="Menu"
        class="topbar-button"
        severity="secondary"
        text
        rounded
        @click="visibleMenu = !visibleMenu"
      />
    </div>
  </div>

  <Drawer v-model:visible="visibleConfig" header="Configuracoes" position="right">
    <Config />
  </Drawer>

  <Drawer v-model:visible="visibleMenu" header="Menu" position="right">
    <MobileMenu @close="visibleMenu = false" />
  </Drawer>
</template>

<style scoped lang="scss">
.header-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.85rem;
  padding: 0.55rem 0.75rem;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.mobile-logo {
  display: none;
  width: 5.25rem;
  height: 2.6rem;
  object-fit: contain;
}

h1 {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(0.95rem, 1.4vw, 1.18rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.1;
}

.actions {
  display: flex;
  gap: 0.25rem;
}

.btn-menu {
  display: none;
}

.topbar-button {
  width: 2.25rem;
  height: 2.25rem;
}

@media (max-width: 768px) {
  .header-title {
    min-height: 3.75rem;
  }

  .mobile-logo {
    display: block;
  }

  .actions {
    display: none;
  }

  .btn-menu {
    display: block;
  }
}
</style>
