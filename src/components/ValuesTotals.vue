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
  min-width: 0 !important;
  border: 1px solid color-mix(in srgb, var(--p-content-border-color), transparent 35%);
  box-shadow: var(--app-card-shadow);
  overflow: hidden;
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.metric-icon {
  width: 2.35rem;
  height: 2.35rem;
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
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.2;
}

h2 {
  margin: 0;
  font-size: clamp(1rem, 1.35vw, 1.28rem);
  font-weight: 750;
  letter-spacing: -0.03em;
}

small {
  display: block;
  margin-top: 0.1rem;
  opacity: 0.7;
  font-size: 0.72rem;
  line-height: 1.2;
}
</style>
