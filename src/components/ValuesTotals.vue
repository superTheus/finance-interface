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
  <Card :class="props.class">
    <template #content>
      <div class="text-center">
        <h2> {{ utils.formatCurrency(props.value || 0) }} </h2>
        <p> {{ props.label }} </p>
      </div>
    </template>
  </Card>
</template>
