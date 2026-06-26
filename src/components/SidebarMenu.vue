<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useUserStore } from '@/stores/user';
import { useRoute, useRouter } from 'vue-router';
import brandLogo from '@/assets/brand/orbitus-logo-dark.png';
import mascot from '@/assets/brand/orbitus-mascot.png';

const router = useRouter();
const route = useRoute();
const { logout } = useUserStore();

const navigateTo = (path: string) => {
  router.push(`/app/${path}`);
};

const isActive = (path: string) => route.path === `/app/${path}`;
</script>

<template>
  <nav class="sidebar-menu orbit-panel" aria-label="Navegação principal">
    <div>
      <div class="brand">
        <img :src="brandLogo" alt="Orbitus" />
        <p>Suas finanças. Seu universo.</p>
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
      <div class="companion">
        <img :src="mascot" alt="Orbi" />
        <div>
          <strong>Orbi</strong>
          <span>Explorador financeiro</span>
        </div>
      </div>

      <button type="button" class="menu-item logout" @click="logout">
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
  padding: 1rem;
}

.brand {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1.2rem;
}

.brand img {
  width: 100%;
  max-height: 9rem;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--app-border);
}

.brand p {
  color: var(--app-text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}

.menu-list {
  display: grid;
  gap: 0.45rem;
  padding: 0;
  list-style: none;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 2.95rem;
  gap: 0.75rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--app-text-muted);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.menu-item:hover,
.menu-item.active {
  border-color: var(--app-border-strong);
  color: var(--app-text);
  background: var(--app-surface-soft);
}

.menu-item.active {
  box-shadow: inset 3px 0 0 var(--orbit-cyan);
}

.menu-item:hover {
  transform: translateX(2px);
}

.menu-item span:last-child {
  font-size: 0.92rem;
  font-weight: 700;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  color: var(--orbit-cyan);
  background: rgba(0, 212, 200, 0.1);
  flex: 0 0 auto;
}

.sidebar-footer {
  display: grid;
  gap: 0.85rem;
  padding-top: 1rem;
}

.companion {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem;
  border-top: 1px solid var(--app-border);
}

.companion img {
  width: 4.4rem;
  height: 3.35rem;
  border-radius: 8px;
  object-fit: cover;
}

.companion strong {
  display: block;
  color: var(--orbit-purple);
  font-size: 1rem;
  font-weight: 800;
}

.companion span {
  display: block;
  color: var(--app-text-muted);
  font-size: 0.72rem;
  line-height: 1.25;
}

.logout {
  color: var(--orbit-pink);
}

.logout .menu-icon {
  color: var(--orbit-pink);
  background: rgba(255, 84, 112, 0.12);
}
</style>
