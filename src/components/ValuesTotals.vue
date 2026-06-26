<script setup lang="ts">
import { Utils } from '@/services/utils';
import { computed, useAttrs } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  value: Number,
  label: String,
  icon: String,
  hint: String,
})

const utils = new Utils();
const attrs = useAttrs();
const cardClasses = computed(() => ['metric-card', attrs.class]);
</script>

<template>
  <Card :class="cardClasses">
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
  min-width: 0;
  min-height: 5.6rem;
  overflow: hidden;
}

.metric-content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.metric-icon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: currentColor;
  flex: 0 0 auto;
}

.metric-label {
  margin-bottom: 0.15rem;
  opacity: 0.82;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.2;
}

h2 {
  margin: 0;
  color: currentColor;
  font-size: clamp(0.98rem, 1.45vw, 1.25rem);
  font-weight: 800;
  letter-spacing: 0;
}

small {
  display: block;
  margin-top: 0.1rem;
  opacity: 0.7;
  font-size: 0.72rem;
  line-height: 1.2;
}
</style>
