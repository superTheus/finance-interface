<script setup lang="ts">
import { Utils } from '@/services/utils';


const props = defineProps({
  value: Number,
  label: String,
  icon: String,
  class: String
})

const utils = new Utils();

</script>

<template>
  <Card :class="'main ' + props.class">
    <template #content>
      <div class="text-center">
        <h2> {{ utils.formatCurrency(props.value || 0) }} </h2>
        <p> {{ props.label }} </p>
      </div>
    </template>
  </Card>
</template>

<style scoped lang="scss">
.main {
  min-width: 12em !important;
}
</style>
