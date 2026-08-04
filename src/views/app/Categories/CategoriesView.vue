<script setup lang="ts">
import { Api } from '@/services/api';
import type { Categories } from '@/types/types';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const api = new Api();
const toast = useToast();
const confirm = useConfirm();
const categories = ref<Categories[]>([]);
const loading = ref(true);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const search = ref('');
const typeFilter = ref<string | null>(null);
const activeFilter = ref<string | null>(null);
const page = ref(0);
const total = ref(0);
const rows = 10;

const typeOptions = [
  { label: 'Despesa', value: 'D' },
  { label: 'Receita', value: 'R' },
  { label: 'Ambos', value: 'A' },
];
const activeOptions = [
  { label: 'Ativas', value: 'S' },
  { label: 'Inativas', value: 'N' },
];
const iconOptions = [
  'pi-tag', 'pi-home', 'pi-car', 'pi-heart', 'pi-book', 'pi-shopping-cart',
  'pi-play', 'pi-briefcase', 'pi-wallet', 'pi-chart-line', 'pi-bolt', 'pi-gift',
].map((value) => ({ label: value.replace('pi-', ''), value }));

const emptyForm = (): Partial<Categories> => ({
  nome: '',
  descricao: '',
  cor: '6c5ce7',
  icone: 'pi-tag',
  tipo: 'D',
  ativo: 'S',
});
const form = ref<Partial<Categories>>(emptyForm());
const title = computed(() => editingId.value ? 'Editar categoria' : 'Nova categoria');

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Não foi possível concluir a operação.';
}

async function loadCategories(): Promise<void> {
  loading.value = true;
  try {
    const response = await api.findCategories({
      filter: {
        ...(search.value ? { pesquisa: search.value } : {}),
        ...(typeFilter.value ? { tipo: typeFilter.value as Categories['tipo'] } : {}),
        ...(activeFilter.value ? { ativo: activeFilter.value as Categories['ativo'] } : {}),
      } as Partial<Categories> & { pesquisa?: string },
      limit: rows,
      offset: page.value,
      order: { cols: ['nome'], direction: 'ASC' },
    });
    categories.value = response.data;
    total.value = response.total;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar', detail: errorMessage(error), life: 4000 });
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingId.value = null;
  form.value = emptyForm();
  dialogVisible.value = true;
}

function openEdit(category: Categories): void {
  editingId.value = category.id ?? null;
  form.value = { ...category, cor: category.cor?.replace('#', '') };
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  if (!form.value.nome?.trim()) {
    toast.add({ severity: 'warn', summary: 'Nome obrigatório', detail: 'Informe o nome da categoria.', life: 3000 });
    return;
  }
  saving.value = true;
  const payload = {
    ...form.value,
    cor: form.value.cor ? `#${form.value.cor.replace('#', '')}` : undefined,
  };
  try {
    if (editingId.value) {
      await api.updateCategory(editingId.value, payload);
    } else {
      await api.createCategory(payload);
    }
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Categoria salva', detail: 'As alterações foram aplicadas.', life: 3000 });
    await loadCategories();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail: errorMessage(error), life: 4000 });
  } finally {
    saving.value = false;
  }
}

async function toggleActive(category: Categories): Promise<void> {
  if (!category.id) return;
  try {
    await api.setCategoryActive(category.id, category.ativo !== 'S');
    toast.add({
      severity: 'success',
      summary: category.ativo === 'S' ? 'Categoria inativada' : 'Categoria ativada',
      detail: category.nome,
      life: 2500,
    });
    await loadCategories();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error), life: 4000 });
  }
}

function remove(category: Categories): void {
  if (!category.id) return;
  confirm.require({
    header: 'Excluir categoria',
    message: `Deseja excluir “${category.nome}”? Categorias em uso serão apenas inativadas.`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const result = await api.deleteCategory(category.id!);
        toast.add({
          severity: result.inativada ? 'info' : 'success',
          summary: result.inativada ? 'Categoria inativada' : 'Categoria excluída',
          detail: result.message || category.nome,
          life: 4000,
        });
        await loadCategories();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error), life: 4000 });
      }
    },
  });
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch([search, typeFilter, activeFilter], () => {
  page.value = 0;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadCategories, 250);
});
watch(page, loadCategories);
onMounted(loadCategories);
</script>

<template>
  <section class="categories-page app-page">
    <div class="list-header">
      <div>
        <p class="eyebrow">Organização financeira</p>
        <h2>Categorias financeiras</h2>
        <span>Organize receitas e despesas sem alterar seus registros antigos.</span>
      </div>
      <div class="page-actions">
        <Button label="Nova categoria" icon="pi pi-plus" class="p-button-sm" @click="openCreate" />
      </div>
    </div>

    <div class="filters orbit-panel">
      <span class="search-box">
        <i class="pi pi-search"></i>
        <InputText v-model="search" placeholder="Pesquisar por nome ou descrição" />
      </span>
      <Select v-model="typeFilter" :options="typeOptions" optionLabel="label" optionValue="value"
        showClear placeholder="Todos os tipos" />
      <Select v-model="activeFilter" :options="activeOptions" optionLabel="label" optionValue="value"
        showClear placeholder="Todas as situações" />
    </div>

    <div v-if="loading" class="loading-state orbit-panel">
      <ProgressSpinner strokeWidth="4" />
      <span>Carregando categorias...</span>
    </div>

    <div v-else-if="!categories.length" class="empty-state orbit-panel">
      <i class="pi pi-tags"></i>
      <strong>Nenhuma categoria encontrada</strong>
      <span>Cadastre uma categoria ou ajuste os filtros.</span>
    </div>

    <div v-else class="responsive-table">
      <DataTable :value="categories" stripedRows>
            <Column header="Categoria">
              <template #body="{ data }">
                <div class="category-cell">
                  <span class="category-icon" :style="{ backgroundColor: `${data.cor || '#94a3b8'}22`, color: data.cor || '#94a3b8' }">
                    <i :class="['pi', data.icone || 'pi-tag']"></i>
                  </span>
                  <div><strong>{{ data.nome }}</strong><small>{{ data.descricao || 'Sem descrição' }}</small></div>
                </div>
              </template>
            </Column>
            <Column header="Tipo">
              <template #body="{ data }">
                <Tag :value="typeOptions.find(item => item.value === data.tipo)?.label"
                  :severity="data.tipo === 'D' ? 'danger' : data.tipo === 'R' ? 'success' : 'info'" />
              </template>
            </Column>
            <Column header="Situação">
              <template #body="{ data }">
                <Tag :value="data.ativo === 'S' ? 'Ativa' : 'Inativa'" :severity="data.ativo === 'S' ? 'success' : 'secondary'" />
              </template>
            </Column>
            <Column header="Ações">
              <template #body="{ data }">
                <div class="table-actions">
                  <Button icon="pi pi-pencil" text rounded aria-label="Editar" @click="openEdit(data)" />
                  <Button :icon="data.ativo === 'S' ? 'pi pi-eye-slash' : 'pi pi-eye'" text rounded
                    :aria-label="data.ativo === 'S' ? 'Inativar' : 'Ativar'" @click="toggleActive(data)" />
                  <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Excluir" @click="remove(data)" />
                </div>
              </template>
            </Column>
      </DataTable>
    </div>
    <Paginator v-if="total > rows" v-model:first="page" :rows="rows" :totalRecords="total" />

    <Dialog v-model:visible="dialogVisible" modal :header="title" class="category-dialog">
      <form class="form-grid" @submit.prevent="save">
        <div class="full">
          <label class="label" for="category-name">Nome *</label>
          <InputText id="category-name" v-model="form.nome" class="w-full" maxlength="100" />
        </div>
        <div class="full">
          <label class="label" for="category-description">Descrição</label>
          <Textarea id="category-description" v-model="form.descricao" class="w-full" rows="3" autoResize />
        </div>
        <div>
          <label class="label" for="category-type">Tipo *</label>
          <Select id="category-type" v-model="form.tipo" :options="typeOptions" optionLabel="label"
            optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="label" for="category-active">Situação</label>
          <Select id="category-active" v-model="form.ativo" :options="activeOptions" optionLabel="label"
            optionValue="value" class="w-full" />
        </div>
        <div>
          <label class="label">Cor</label>
          <div class="color-field">
            <ColorPicker v-model="form.cor" format="hex" />
            <InputText v-model="form.cor" maxlength="7" />
          </div>
        </div>
        <div>
          <label class="label" for="category-icon">Ícone</label>
          <Select id="category-icon" v-model="form.icone" :options="iconOptions" optionLabel="label"
            optionValue="value" class="w-full">
            <template #option="{ option }"><i :class="['pi', option.value]"></i>&nbsp; {{ option.label }}</template>
            <template #value="{ value }"><i :class="['pi', value || 'pi-tag']"></i>&nbsp; {{ value || 'pi-tag' }}</template>
          </Select>
        </div>
      </form>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
        <Button label="Salvar" icon="pi pi-check" :loading="saving" :disabled="saving" @click="save" />
      </template>
    </Dialog>
  </section>
</template>

<style scoped lang="scss">
.categories-page { align-content: start; gap: .75rem; }
.filters { display: grid; grid-template-columns: minmax(16rem, 1fr) 12rem 12rem; gap: .65rem; padding: .75rem; }
.search-box { position: relative; display: flex; align-items: center; }
.search-box i { position: absolute; left: .75rem; z-index: 1; color: var(--app-text-muted); }
.search-box :deep(input) { width: 100%; padding-left: 2.2rem; }
.category-cell { display: flex; align-items: center; gap: .7rem; min-width: 14rem; }
.category-cell div { display: grid; gap: .15rem; }
.category-cell small { color: var(--app-text-muted); }
.category-icon { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 10px; flex: 0 0 auto; }
.table-actions { display: flex; gap: .1rem; }
.loading-state { min-height: 10rem; display: grid; place-items: center; align-content: center; gap: .75rem; color: var(--app-text-muted); }
.loading-state :deep(.p-progressspinner) { width: 2.5rem; height: 2.5rem; }
.empty-state i { font-size: 2rem; color: var(--orbit-purple); }
.empty-state strong, .empty-state span { display: block; margin-top: .4rem; }
.color-field { display: flex; align-items: center; gap: .65rem; }
.color-field :deep(input) { width: 7rem; }
@media (max-width: 760px) {
  .filters { grid-template-columns: 1fr; }
}
</style>
