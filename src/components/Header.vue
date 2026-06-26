<script setup lang="ts">
import { computed, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import { useConfigStore } from '@/stores/config';
import Config from './Config.vue';
import MobileMenu from './MobileMenu.vue';
import brandLogo from '@/assets/brand/orbitus-logo-dark.png';

const props = defineProps<{ currentPage: string | null }>();

const user = useUserStore();
const config = useConfigStore();

const visibleConfig = ref(false);
const visibleMenu = ref(false);

const firstName = computed(() => user.user?.nome?.split(' ')[0] || 'Explorador');
</script>

<template>
  <div class="header-title orbit-panel">
    <div class="title">
      <img :src="brandLogo" alt="Orbitus" class="mobile-logo" />
      <div>
        <p class="eyebrow">Painel Orbitus</p>
        <h1>{{ props.currentPage }}</h1>
        <span>Olá, {{ firstName }}. Seu universo financeiro está em rota.</span>
      </div>
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
        v-tooltip.left="config.config.darkMode ? 'Tema claro' : 'Tema escuro'"
      />
      <Button
        icon="pi pi-cog"
        aria-label="Configurações"
        class="topbar-button"
        severity="secondary"
        text
        rounded
        v-tooltip.left="'Configurações'"
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
        v-tooltip.left="'Menu'"
        @click="visibleMenu = !visibleMenu"
      />
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 5.15rem;
  padding: 0.8rem 1rem;
}

.title {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.mobile-logo {
  display: none;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--app-border);
}

h1 {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.1;
}

span {
  display: block;
  margin-top: 0.12rem;
  color: var(--app-text-muted);
  font-size: 0.86rem;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.35rem;
}

.btn-menu {
  display: none;
}

.topbar-button {
  width: 2.65rem;
  height: 2.65rem;
}

@media (max-width: 768px) {
  .header-title {
    min-height: 4.75rem;
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

  span {
    display: none;
  }
}
</style>
