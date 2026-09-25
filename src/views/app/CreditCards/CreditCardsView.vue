<script setup lang="ts">
import { Api } from '@/services/api';
import type { CreditCard, CreditCardInput } from '@/types/types';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

type CardForm = {
  nome: string;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
  limite_parcelas: number | null;
};

const api = new Api();
const toast = useToast();
const confirm = useConfirm();
const cards = ref<CreditCard[]>([]);
const loading = ref(true);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = ref<CardForm>(emptyForm());
const dialogTitle = computed(() => editingId.value === null ? 'Novo cartão de crédito' : 'Editar cartão de crédito');

function emptyForm(): CardForm {
  return { nome: '', dia_fechamento: null, dia_vencimento: null, limite_parcelas: 12 };
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Não foi possível concluir a operação.';
}

async function loadCards(): Promise<void> {
  loading.value = true;
  try {
    cards.value = await api.listCreditCards();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar cartões', detail: errorMessage(error), life: 4000 });
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingId.value = null;
  form.value = emptyForm();
  dialogVisible.value = true;
}

function openEdit(card: CreditCard): void {
  editingId.value = card.id;
  form.value = {
    nome: card.nome,
    dia_fechamento: card.dia_fechamento,
    dia_vencimento: card.dia_vencimento,
    limite_parcelas: card.limite_parcelas,
  };
  dialogVisible.value = true;
}

function validDay(value: number | null): value is number {
  return Number.isInteger(value) && value !== null && value >= 1 && value <= 31;
}

async function save(): Promise<void> {
  const name = form.value.nome.trim();
  if (!name || name.length > 100 || !validDay(form.value.dia_fechamento)
      || !validDay(form.value.dia_vencimento)
      || !Number.isInteger(form.value.limite_parcelas)
      || form.value.limite_parcelas === null
      || form.value.limite_parcelas < 1 || form.value.limite_parcelas > 120) {
    toast.add({ severity: 'warn', summary: 'Confira os dados', detail: 'Informe o nome, os dias de 1 a 31 e o limite de 1 a 120 parcelas.', life: 4000 });
    return;
  }

  const payload: CreditCardInput = {
    nome: name,
    dia_fechamento: form.value.dia_fechamento,
    dia_vencimento: form.value.dia_vencimento,
    limite_parcelas: form.value.limite_parcelas,
  };
  saving.value = true;
  try {
    if (editingId.value === null) {
      await api.createCreditCard(payload);
    } else {
      await api.updateCreditCard(editingId.value, payload);
    }
    dialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'Cartão salvo', life: 3000 });
    await loadCards();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar cartão', detail: errorMessage(error), life: 4000 });
  } finally {
    saving.value = false;
  }
}

function remove(card: CreditCard): void {
  confirm.require({
    header: 'Excluir cartão',
    message: `Deseja excluir “${card.nome}”?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.deleteCreditCard(card.id);
        toast.add({ severity: 'success', summary: 'Cartão excluído', life: 3000 });
        await loadCards();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro ao excluir cartão', detail: errorMessage(error), life: 4000 });
      }
    },
  });
}

onMounted(loadCards);
</script>

<template>
  <section class="credit-cards-page app-page">
    <div class="list-header">
      <div>
        <p class="eyebrow">Cartões de crédito</p>
        <h2>Seus cartões</h2>
        <span>Cadastre as datas mensais da fatura e o máximo de parcelas permitido.</span>
      </div>
      <div class="page-actions">
        <Button label="Novo cartão" icon="pi pi-plus" class="p-button-sm" @click="openCreate" />
      </div>
    </div>

    <div v-if="loading" class="loading-state orbit-panel">
      <ProgressSpinner strokeWidth="4" />
      <span>Carregando cartões...</span>
    </div>
    <div v-else-if="!cards.length" class="empty-state orbit-panel">
      <i class="pi pi-credit-card"></i>
      <strong>Nenhum cartão cadastrado</strong>
      <span>Adicione seu primeiro cartão para começar.</span>
    </div>
    <div v-else class="responsive-table">
      <DataTable :value="cards" stripedRows>
        <Column header="Cartão">
          <template #body="{ data }"><strong>{{ data.nome }}</strong></template>
        </Column>
        <Column header="Fechamento"><template #body="{ data }">Dia {{ data.dia_fechamento }}</template></Column>
        <Column header="Vencimento"><template #body="{ data }">Dia {{ data.dia_vencimento }}</template></Column>
        <Column header="Parcelamento máximo"><template #body="{ data }">{{ data.limite_parcelas }}x</template></Column>
        <Column header="Ações">
          <template #body="{ data }">
            <div class="table-actions">
              <Button icon="pi pi-pencil" text rounded aria-label="Editar cartão" @click="openEdit(data)" />
              <Button icon="pi pi-trash" text rounded severity="danger" aria-label="Excluir cartão" @click="remove(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="dialogVisible" modal :header="dialogTitle" class="card-dialog">
      <form class="form-grid" @submit.prevent="save">
        <div class="full">
          <label class="label" for="card-name">Nome do cartão *</label>
          <InputText id="card-name" v-model="form.nome" class="w-full" maxlength="100" placeholder="Ex.: Nubank" />
        </div>
        <div>
          <label class="label" for="card-closing">Dia de fechamento *</label>
          <InputNumber inputId="card-closing" v-model="form.dia_fechamento" :min="1" :max="31" :useGrouping="false" class="w-full" fluid />
        </div>
        <div>
          <label class="label" for="card-due">Dia de vencimento *</label>
          <InputNumber inputId="card-due" v-model="form.dia_vencimento" :min="1" :max="31" :useGrouping="false" class="w-full" fluid />
        </div>
        <div class="full">
          <label class="label" for="card-installments">Parcelamento máximo *</label>
          <InputNumber inputId="card-installments" v-model="form.limite_parcelas" :min="1" :max="120" :useGrouping="false" suffix="x" class="w-full" fluid />
        </div>
        <small class="full form-note">Fechamento e vencimento são dias recorrentes de cada mês.</small>
      </form>
      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
        <Button label="Salvar cartão" icon="pi pi-check" :loading="saving" :disabled="saving" @click="save" />
      </template>
    </Dialog>
  </section>
</template>

<style scoped lang="scss">
.credit-cards-page { align-content: start; gap: .75rem; }
.loading-state { min-height: 10rem; display: grid; place-items: center; align-content: center; gap: .75rem; color: var(--app-text-muted); }
.loading-state :deep(.p-progressspinner) { width: 2.5rem; height: 2.5rem; }
.empty-state i { font-size: 2rem; color: var(--orbit-purple); }
.empty-state strong, .empty-state span { display: block; margin-top: .4rem; }
.table-actions { display: flex; gap: .1rem; }
.form-note { color: var(--app-text-muted); line-height: 1.4; }
:global(.card-dialog) { width: min(34rem, calc(100vw - 2rem)); }
@media (max-width: 560px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
