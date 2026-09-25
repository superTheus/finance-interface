<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue';
import type { Categories, FilterBill } from '@/types/types';
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
  categories: {
    type: Array as PropType<Categories[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  close: [value: boolean],
  'apply-filters': [filters: FilterBill],
}>();

function cloneFilters(filters?: FilterBill): FilterBill | null {
  if (!filters) return null;

  return {
    ...filters,
    search: filters.search ?? '',
    categoryIds: [...(filters.categoryIds ?? [])],
    period: { ...filters.period },
    month: { ...filters.month },
    datePeriod: filters.datePeriod.map((date) => new Date(date)),
  };
}

const draftFilters = ref<FilterBill | null>(cloneFilters(props.filterSelected));
const dialogVisible = computed({
  get: () => props.showFilter,
  set: (visible: boolean) => {
    if (!visible) emit('close', false);
  },
});

watch(() => props.showFilter, (visible) => {
  if (visible) draftFilters.value = cloneFilters(props.filterSelected);
});

const close = () => {
  emit('close', false);
};

const applyFilters = () => {
  if (!draftFilters.value) return;

  emit('apply-filters', cloneFilters(draftFilters.value)!);
  emit('close', false);
};
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Filtros"
    class="filter-dialog"
    style="--app-dialog-width: 40rem; --app-dialog-height: min(42rem, 90vh)"
    :closable="false"
  >
    <div v-if="draftFilters" class="filter-section">
      <h4>Busca</h4>
      <InputGroup class="mt-2">
        <InputGroupAddon><i class="pi pi-search" /></InputGroupAddon>
        <InputText
          v-model="draftFilters.search"
          class="w-full"
          placeholder="Buscar por título ou descrição"
          @keyup.enter="applyFilters"
        />
      </InputGroup>
    </div>

    <Divider />

    <div v-if="draftFilters" class="filter-section">
      <h4>Categoria</h4>
      <MultiSelect
        v-model="draftFilters.categoryIds"
        :options="categories"
        optionLabel="nome"
        optionValue="id"
        filter
        display="chip"
        class="w-full mt-2"
        placeholder="Todas as categorias"
        empty-filter-message="Nenhuma categoria encontrada"
      />
    </div>

    <Divider />

    <div v-if="draftFilters" class="filter-section">
      <h4>Período</h4>
      <SelectButton v-model="draftFilters.period" :options="filtersOptions.options" optionLabel="label" class="mt-2" />

      <div v-if="draftFilters.period && draftFilters.period.value === 3" class="mt-3">
        <div class="filter-options">
          <div class="flex items-center gap-2">
            <RadioButton v-model="draftFilters.radioTypeFilterPeriod" input-id="forMounth" name="period-type" value="mounth" />
            <label for="forMounth">Por mês</label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton v-model="draftFilters.radioTypeFilterPeriod" input-id="forDate" name="period-type" value="date" />
            <label for="forDate">Por data</label>
          </div>
        </div>

        <div v-if="draftFilters.radioTypeFilterPeriod === 'mounth'" class="mt-3">
          <h4>Mês</h4>
          <Select
            v-model="draftFilters.month"
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

        <div v-if="draftFilters.radioTypeFilterPeriod === 'date'" class="mt-3">
          <h4>Data</h4>
          <DatePicker v-model="draftFilters.datePeriod" selectionMode="range" :manualInput="false" class="w-full mt-2" date-format="dd/mm/yy" />
        </div>
      </div>
    </div>

    <Divider />

    <div class="filter-section">
      <h4>Status</h4>

      <div v-if="draftFilters" class="filter-options">
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.statusFilter" input-id="all-status" name="status" value="TO" />
          <label for="all-status">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.statusFilter" input-id="pendentes" name="status" value="PE" />
          <label for="pendentes">Pendentes</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.statusFilter" input-id="pagos" name="status" value="PA" />
          <label for="pagos">Pagos</label>
        </div>
      </div>
    </div>

    <Divider />

    <div class="filter-section">
      <h4>Tipo</h4>

      <div v-if="draftFilters" class="filter-options">
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.type" input-id="all-type" name="type" value="TO" />
          <label for="all-type">Todos</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.type" input-id="despesa" name="type" value="D" />
          <label for="despesa">Despesas</label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="draftFilters.type" input-id="receita" name="type" value="R" />
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
