<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { FilterBill } from '@/types/types';
import { mounths } from '@/constants/constants';

const filtersOptions = ref({
  options: [
    { label: 'Mês atual', value: 1 },
    { label: 'Próximo mês', value: 2 },
    { label: 'Personalizado', value: 3 },
  ],
  mounths,
});

const props = defineProps({
  showFilter: Boolean,
  filterSelected: Object as PropType<FilterBill>,
});

const emit = defineEmits(['close', 'apply-filters']);

const close = () => {
  emit('close', false);
};

const applyFilters = () => {
  emit('close', false);
  emit('apply-filters', props.filterSelected);
};
</script>

<template>
  <Dialog
    :visible="props.showFilter"
    modal
    header="Filtros"
    class="filter-dialog"
    :closable="false"
    @update:visible="close"
  >
    <div v-if="props.filterSelected" class="filter-section">
      <h4>Período</h4>
      <SelectButton v-model="props.filterSelected.period" :options="filtersOptions.options" optionLabel="label" class="mt-2" />

      <div v-if="props.filterSelected.period && props.filterSelected.period.value === 3" class="mt-3">
        <div class="filter-options">
          <div class="flex items-center gap-2">
            <RadioButton v-model="props.filterSelected.radioTypeFilterPeriod" input-id="forMounth" name="mounth" value="mounth" />
            <label for="forMounth">Por mês</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="props.filterSelected.radioTypeFilterPeriod" input-id="forDate" name="date" value="date" />
            <label for="forDate">Por data</label>
          </div>
        </div>

        <div v-if="props.filterSelected.radioTypeFilterPeriod === 'mounth'" class="mt-3">
          <h4>Mês</h4>
          <Select
            v-model="props.filterSelected.month"
            :options="filtersOptions.mounths"
            filter
            optionLabel="label"
            placeholder="Selecione um mês"
            checkmark
            :highlightOnSelect="false"
            class="w-full mt-2"
            empty-filter-message="Não encontrado"
          />
        </div>

        <div v-if="props.filterSelected.radioTypeFilterPeriod === 'date'" class="mt-3">
          <h4>Data</h4>
          <DatePicker v-model="props.filterSelected.datePeriod" selectionMode="range" :manualInput="false" class="w-full mt-2" date-format="dd/mm/yyyy" />
        </div>
      </div>
    </div>

    <Divider />

    <div class="filter-section">
      <h4>Status</h4>

      <div v-if="props.filterSelected" class="filter-options">
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="all-status" name="todos" value="TO" />
          <label for="all-status">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="pendentes" name="pendentes" value="PE" />
          <label for="pendentes">Pendentes</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.statusFilter" input-id="pagos" name="pagos" value="PA" />
          <label for="pagos">Pagos</label>
        </div>
      </div>
    </div>

    <Divider />

    <div class="filter-section">
      <h4>Tipo</h4>

      <div v-if="props.filterSelected" class="filter-options">
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="all-type" name="todos" value="TO" />
          <label for="all-type">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="despesa" name="despesa" value="D" />
          <label for="despesa">Despesas</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="props.filterSelected.type" input-id="receita" name="receita" value="R" />
          <label for="receita">Receitas</label>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer-actions">
        <Button label="Cancelar" severity="secondary" outlined @click="close" />
        <Button label="Aplicar" icon="pi pi-check" @click="applyFilters" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.filter-section {
  display: grid;
  gap: 0.45rem;
}

h4 {
  margin: 0;
  color: var(--app-text);
  font-weight: 800;
}

label {
  color: var(--app-text-muted);
  font-weight: 700;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem 1rem;
  margin-top: 0.55rem;
}
</style>
