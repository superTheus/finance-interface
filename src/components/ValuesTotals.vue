<script setup lang="ts">
import { Utils } from '@/services/utils';

const props = defineProps({
  value: Number,
  label: String,
  icon: String,
  class: String,
  hint: String,
})

const utils = new Utils();
</script>

<template>
  <Card :class="'metric-card ' + (props.class || '')">
    <template #content>
      <div class="metric-content">
        <span class="metric-icon" aria-hidden="true">
          <i :class="props.icon || 'pi pi-wallet'"></i>
        </span>
        <div>
          <p class="metric-label">{{ props.label }}</p>
          <h2>{{ utils.formatCurrency(props.value || 0) }}</h2>
          <small v-if="props.hint">{{ props.hint }}</small>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped lang="scss">
.metric-card {
  min-width: 13rem !important;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color), transparent 35%);
  box-shadow: var(--app-card-shadow);
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.metric-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.55);
  color: currentColor;
  flex: 0 0 auto;
}

.metric-label {
  margin-bottom: 0.15rem;
  opacity: 0.82;
  font-size: 0.86rem;
  font-weight: 700;
}

h2 {
  margin: 0;
  font-size: clamp(1.2rem, 2vw, 1.55rem);
  font-weight: 800;
}

small {
  opacity: 0.72;
}
</style>
