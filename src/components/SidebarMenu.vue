<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { computed } from 'vue';
import { useConfigStore } from '@/stores/config';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';
import logoDark from '@/assets/images/logos/logo_dark_alternative.png';
import logoLight from '@/assets/images/logos/logo_light_alternative.png';
import UserAvatar from '@/components/UserAvatar.vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const config = useConfigStore();
const brandLogo = computed(() => (config.config.darkMode ? logoDark : logoLight));

const navigateTo = (path: string) => {
  router.push(`/app/${path}`);
};

const isActive = (path: string) => route.path === `/app/${path}`;
</script>

<template>
  <nav class="sidebar-menu orbit-panel" aria-label="Navegacao principal">
    <div>
      <div class="brand">
        <img :src="brandLogo" alt="Orbitus" />
      </div>

      <ul class="menu-list">
        <li v-for="item in Routers" :key="item.path">
          <button
            type="button"
            :class="['menu-item', { active: isActive(item.path) }]"
            @click="navigateTo(item.path)"
          >
            <span class="menu-icon">
              <i :class="['pi', item.icon]"></i>
            </span>
            <span>{{ item.name }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div class="sidebar-footer">
      <button type="button" :class="['user-card', { active: isActive('profile') }]"
        aria-label="Abrir perfil" @click="navigateTo('profile')">
        <UserAvatar :name="userStore.user?.nome || 'Usuário'" :photo="userStore.user?.foto" />
        <span class="user-info">
          <strong :title="userStore.user?.nome">{{ userStore.user?.nome || 'Usuário' }}</strong>
          <small :title="userStore.user?.email">{{ userStore.user?.email }}</small>
        </span>
        <i class="pi pi-chevron-right"></i>
      </button>
      <button type="button" class="menu-item logout" @click="userStore.logout">
        <span class="menu-icon">
          <i class="pi pi-sign-out"></i>
        </span>
        <span>Sair</span>
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.sidebar-menu {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 0;
  padding: 0.75rem;
}

.brand {
  margin-bottom: 0.75rem;
}

.brand img {
  display: block;
  width: 100%;
  height: 4.25rem;
  object-fit: contain;
}

.menu-list {
  display: grid;
  gap: 0.2rem;
  padding: 0;
  list-style: none;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.45rem;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.menu-item:hover {
  color: var(--app-text);
  background: var(--app-surface-soft);
}

.menu-item.active {
  border-color: var(--app-border);
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-surface-soft), transparent 22%);
}

.menu-item span:last-child {
  font-size: 0.82rem;
  font-weight: 700;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 8px;
  color: var(--orbit-cyan);
  flex: 0 0 auto;
}

.sidebar-footer {
  display: grid;
  gap: 0.45rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--app-border);
}

.user-card {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 0.55rem;
  padding: 0.5rem 0.35rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--app-text);
  cursor: pointer;
  text-align: left;
}

.user-card:hover, .user-card.active {
  border-color: var(--app-border);
  background: var(--app-surface-soft);
}

.user-info { display: grid; min-width: 0; flex: 1; gap: 0.1rem; }
.user-info strong, .user-info small { overflow-wrap: anywhere; }
.user-info strong { font-size: 0.78rem; }
.user-info small { color: var(--app-text-muted); font-size: 0.66rem; }
.user-card > i { color: var(--app-text-muted); font-size: 0.7rem; }

.logout {
  color: var(--orbit-pink);
}

.logout .menu-icon {
  color: var(--orbit-pink);
}
</style>
