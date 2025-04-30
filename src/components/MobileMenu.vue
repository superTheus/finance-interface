<script setup lang="ts">
import { Routers } from '@/constants/routers';
import { useConfigStore } from '@/stores/config';
import { useUserStore } from '@/stores/user';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { logout } = useUserStore();
const config = useConfigStore();

const navigateTo = (route: string) => {
  router.push(route);
  emits('close');
};

const emits = defineEmits(['close']);
</script>

<template>
  <div class="mobile-menu">

    <div class="menu-container">
      <div v-for="(item, index) in Routers" :key="index" class="menu-item-container mb-3"
        @click="navigateTo(item.path)">
        <div :class="['menu-item', item.path === $route.path ? 'active' : '']">
          <div class="icon-container">
            <i :class="['pi', item.icon]"></i>
          </div>
          <span class="menu-label">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <Button :icon="config.config.darkMode ? 'pi pi-moon' : 'pi pi-sun'" aria-label="Dark Mode" class="btn"
        @click="config.changeTheme" v-tooltip.left="config.config.darkMode ? 'Tema claro' : 'Tema escuro'"
        severity="secondary" />
      <Button icon="pi pi-sign-out" aria-label="Dark Mode" class="btn" v-tooltip.left="'Sair'" @click="logout"
        severity="secondary" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mobile-menu {
  height: 100%;
  display: flex;
  flex-direction: column;

  .menu-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--surface-border);
  }

  .menu-container {
    flex: 1;
    overflow-y: auto;
  }

  .menu-item-container {
    cursor: pointer;
    transition: background-color 0.2s;
    border-radius: 8px;

    &:hover {
      background-color: var(--surface-hover);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 1rem 0;
    border-radius: 8px;
    transition: all 0.3s ease;

    &.active {
      background-color: var(--primary-color);
      color: var(--primary-color-text);

      .menu-label {
        font-weight: 600;
      }
    }

    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      margin-right: 1rem;
      background-color: var(--surface-card);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

      i {
        font-size: 1.2rem;
      }
    }

    .menu-label {
      font-size: 1.1rem;
    }
  }

  .menu-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--surface-border);
  }

  .actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    width: 100%;
  }
}
</style>
