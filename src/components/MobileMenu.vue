<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useConfigStore } from '@/stores/config';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';
import brandLogo from '@/assets/brand/orbitus-logo-dark.png';

const router = useRouter();
const route = useRoute();
const { logout } = useUserStore();
const config = useConfigStore();

const emits = defineEmits(['close']);

const navigateTo = (path: string) => {
  router.push(`/app/${path}`);
  emits('close');
};

const isActive = (path: string) => route.path === `/app/${path}`;
</script>

<template>
  <div class="mobile-menu">
    <div class="mobile-brand">
      <img :src="brandLogo" alt="Orbitus" />
      <p>Suas finanças. Seu universo.</p>
    </div>

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
        v-tooltip.left="config.config.darkMode ? 'Tema claro' : 'Tema escuro'"
        severity="secondary"
      />
      <Button
        icon="pi pi-sign-out"
        aria-label="Sair"
        class="btn"
        v-tooltip.left="'Sair'"
        @click="logout"
        severity="secondary"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mobile-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1rem;
}

.mobile-brand {
  display: grid;
  gap: 0.55rem;
}

.mobile-brand img {
  width: 100%;
  max-height: 9rem;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--app-border);
}

.mobile-brand p {
  color: var(--app-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.menu-container {
  display: grid;
  gap: 0.55rem;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  min-height: 3.15rem;
  padding: 0.65rem 0.7rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text-muted);
  background: var(--app-surface);
  cursor: pointer;
  text-align: left;
}

.menu-item.active {
  border-color: var(--app-border-strong);
  color: var(--app-text);
  background: var(--app-surface-soft);
  box-shadow: inset 3px 0 0 var(--orbit-cyan);
}

.icon-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 8px;
  color: var(--orbit-cyan);
  background: rgba(0, 212, 200, 0.1);
}

.menu-label {
  font-size: 0.95rem;
  font-weight: 800;
}

.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--app-border);
}

.actions .btn {
  flex: 1;
}
</style>
