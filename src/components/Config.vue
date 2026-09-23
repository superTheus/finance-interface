<script setup lang="ts">
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

const setDarkMode = (value: boolean) => {
  config.setConfig({
    ...config.config,
    darkMode: value,
  });

  document.documentElement.classList.toggle('dark-mode', value);
};
</script>

<template>
  <div class="config-panel">
    <section class="setting-row">
      <div>
        <strong>Tema escuro</strong>
        <span>Visual principal Orbitus</span>
      </div>
      <ToggleSwitch :modelValue="config.config.darkMode" @update:modelValue="setDarkMode" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.config-panel {
  display: grid;
  gap: 1.4rem;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

strong {
  display: block;
  color: var(--app-text);
  font-weight: 800;
}

span {
  display: block;
  color: var(--app-text-muted);
  font-size: 0.82rem;
}
</style>
