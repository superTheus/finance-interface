<script setup lang="ts">
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

const colors = [
  { name: 'Noite', value: '#0B1020' },
  { name: 'Órbita', value: '#6C5CE7' },
  { name: 'Ciano', value: '#00D4C8' },
  { name: 'Solar', value: '#FFB020' },
  { name: 'Pulso', value: '#FF5470' },
];

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

    <section>
      <p class="eyebrow">Paleta</p>
      <div class="palette">
        <div v-for="color in colors" :key="color.value" class="swatch">
          <span :style="{ background: color.value }"></span>
          <small>{{ color.name }}</small>
        </div>
      </div>
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

.palette {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.5rem;
}

.swatch {
  display: grid;
  gap: 0.35rem;
}

.swatch span {
  height: 2.4rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.swatch small {
  color: var(--app-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
}
</style>
