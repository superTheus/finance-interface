<script setup lang="ts">
import moment from 'moment';
import { ref, type PropType } from 'vue';
import type { FilterBill } from '@/types/types';
import { mounths } from '@/constants/constants';

const filtersOptions = ref({
  options: [
    { label: 'Mês Atual', value: 1 },
    { label: 'Próximo Mês', value: 2 },
    { label: 'Persornalizado', value: 3 }
  ],
  mounths: mounths
})

const props = defineProps({
  showFilter: Boolean,
  filterSelected: Object as PropType<FilterBill>
});

const emit = defineEmits(['close', 'apply-filters']);

const close = () => {
  emit('close', false);
}

const applyFilters = () => {
  emit('close', false);
  emit('apply-filters', props.filterSelected);
}

</script>

<template>
  <Dialog v-model:visible="props.showFilter" modal header="Edit Profile" :style="{ width: 'auto' }" :closable="false">
    <template #header>
      <h2> Filtros </h2>
    </template>

    <div v-if="props.filterSelected" class="">
      <h4> Período </h4>
      <SelectButton v-model="props.filterSelected.period" :options="filtersOptions.options" optionLabel="label"
        class="mt-2" />

      <div v-if="props.filterSelected.period && props.filterSelected.period.value === 3" class="mt-3">
        <div class="flex flex-wrap gap-4">
          <div class="flex items-center gap-2">
            <RadioButton v-model="props.filterSelected.radioTypeFilterPeriod" input-id="forMounth" name="mounth"
              value="mounth" />
            <label for="forMounth">Por Mês</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="props.filterSelected.radioTypeFilterPeriod" input-id="forDate" name="date" value="date" />
            <label for="forDate">Por Data</label>
          </div>
        </div>

        <div v-if="props.filterSelected.radioTypeFilterPeriod === 'mounth'" class="mt-2">
          <h4> Mês </h4>
          <Select v-model="props.filterSelected.month" :options="filtersOptions.mounths" filter optionLabel="label"
            placeholder="Selecione um mês" checkmark :highlightOnSelect="false" class="w-full"
            empty-filter-message="Não encontrado" />
        </div>

        <div v-if="props.filterSelected.radioTypeFilterPeriod === 'date'" class="mt-2">
          <h4> Data </h4>
          <div class="flex gap-2">
            <DatePicker v-model="props.filterSelected.datePeriod" selectionMode="range" :manualInput="false" class="w-full"
              date-format="dd/mm/yyyy" />
          </div>
        </div>
      </div>
    </div>

    <Divider />

    <div class="">
      <h4> Status </h4>

      <div v-if="props.filterSelected" class="flex flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="all" name="todos" value="TO" />
          <label for="all">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="pendentes" name="pendentes" value="PN" />
          <label for="pendentes">Pendentes</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="pagos" name="pagos" value="PA" />
          <label for="pagos">Pagos</label>
        </div>
      </div>
    </div>

    <Divider />

    <div class="">
      <h4> Tipo </h4>

      <div v-if="props.filterSelected" class="flex flex-wrap gap-4 mt-2">
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="all" name="todos" value="TO" />
          <label for="all">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="despesa" name="despesa" value="D" />
          <label for="despesa">Despesas</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="receita" name="receita" value="R" />
          <label for="receita">Receita</label>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" text severity="danger" @click="close" autofocus />
      <Button label="Aplicar" outlined severity="primary" @click="applyFilters" autofocus />
    </template>
  </Dialog>
</template>

<style scoped></style>
