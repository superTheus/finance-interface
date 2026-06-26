<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useConfigStore } from '@/stores/config';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import logoDark from '@/assets/images/logos/logo_dark_alternative.png';
import logoLight from '@/assets/images/logos/logo_light_alternative.png';

const router = useRouter();
const route = useRoute();
const { logout } = useUserStore();
const config = useConfigStore();
const brandLogo = computed(() => (config.config.darkMode ? logoDark : logoLight));

const emits = defineEmits(['close']);

const navigateTo = (path: string) => {
  router.push(`/app/${path}`);
  emits('close');
};

const isActive = (path: string) => route.path === `/app/${path}`;
</script>

<template>
  <div class="mobile-menu">
    <img :src="brandLogo" alt="Orbitus" class="mobile-brand" />

    <div class="menu-container">
      <button
        v-for="item in Routers"
        :key="item.path"
        type="button"
        :class="['menu-item', { active: isActive(item.path) }]"
        @click="navigateTo(item.path)"
      >
        <span class="icon-container">
          <i :class="['pi', item.icon]"></i>
        </span>
        <span class="menu-label">{{ item.name }}</span>
      </button>
    </div>

    <div class="actions">
      <Button
        :icon="config.config.darkMode ? 'pi pi-moon' : 'pi pi-sun'"
        aria-label="Alternar tema"
        class="btn"
        @click="config.changeTheme"
        severity="secondary"
        text
      />
      <Button
        icon="pi pi-sign-out"
        aria-label="Sair"
        class="btn"
        @click="logout"
        severity="secondary"
        text
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mobile-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.85rem;
}

.mobile-brand {
  width: 100%;
  height: 4.5rem;
  object-fit: contain;
}

.menu-container {
  display: grid;
  gap: 0.25rem;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 2.65rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.menu-item.active,
.menu-item:hover {
  border-color: var(--app-border);
  color: var(--app-text);
  background: var(--app-surface-soft);
}

.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 8px;
  color: var(--orbit-cyan);
}

.menu-label {
  font-size: 0.84rem;
  font-weight: 700;
}

.actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--app-border);
}

.actions .btn {
  flex: 1;
}
</style>
