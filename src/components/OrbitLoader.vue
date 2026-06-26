<script setup lang="ts">
import walkStrip from '@/assets/brand/orbitus-walk-strip.png';

withDefaults(defineProps<{
  label?: string;
  compact?: boolean;
}>(), {
  label: 'Traçando sua rota financeira...',
  compact: false,
});
</script>

<template>
  <div :class="['orbit-loader', { 'orbit-loader_compact': compact }]">
    <div class="orbit-loader__sprite" :style="{ backgroundImage: `url(${walkStrip})` }" aria-hidden="true"></div>
    <p>{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
.orbit-loader {
  display: grid;
  place-items: center;
  gap: 0.75rem;
  min-height: 16rem;
  color: var(--app-text-muted);
  text-align: center;
}

.orbit-loader_compact {
  min-height: 9rem;
}

.orbit-loader__sprite {
  width: min(12rem, 62vw);
  aspect-ratio: 307 / 330;
  border-radius: 8px;
  background-repeat: no-repeat;
  background-size: 1000% 100%;
  background-position: 0 0;
  box-shadow: 0 18px 45px rgba(108, 92, 231, 0.18);
  animation: orbitus-walk 1s steps(10) infinite;
}

.orbit-loader p {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
}

@keyframes orbitus-walk {
  to {
    background-position: -1000% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-loader__sprite {
    animation: none;
  }
}
</style>
