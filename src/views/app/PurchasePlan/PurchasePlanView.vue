<script setup lang="ts">
import { Api } from '@/services/api';
import { Utils } from '@/services/utils';
import { calculatePurchaseOptionRange, isSafePurchaseUrl, isValidPriceRange } from '@/services/purchasePlanning';
import type {
  BankAccounts, Categories, CreditCard, FinancialSettings, PaymentsForms, PurchaseItem,
  PurchaseOption, PurchasePlanSummary, PurchasePriority, PurchaseProjection,
} from '@/types/types';
import moment from 'moment';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const api = new Api();
const utils = new Utils();
const toast = useToast();
const confirm = useConfirm();
const loading = ref(true);
const saving = ref(false);
const items = ref<PurchaseItem[]>([]);
const categories = ref<Categories[]>([]);
const bankAccounts = ref<BankAccounts[]>([]);
const paymentForms = ref<PaymentsForms[]>([]);
const creditCards = ref<CreditCard[]>([]);
const summary = ref<PurchasePlanSummary>({
  total_itens_planejados: 0,
  itens_disponiveis_agora: 0,
  itens_meses_futuros: 0,
  itens_comprados: 0,
  valor_total_desejos: 0,
  menor_custo_possivel: 0,
  reserva_minima: 0,
  saldo_disponivel_compras: 0,
  proxima_compra_sugerida: null,
  alertas: [],
});
const settings = ref<FinancialSettings>({
  reserva_minima: 0,
  utilizar_reserva: 'S',
  horizonte_meses: 6,
});

const itemDialog = ref(false);
const detailDialog = ref(false);
const optionDialog = ref(false);
const buyDialog = ref(false);
const settingsOpen = ref(false);
const editingItemId = ref<number | null>(null);
const editingOptionId = ref<number | null>(null);
const selectedItem = ref<PurchaseItem | null>(null);
const detailLoading = ref(false);
const projectionMode = ref<'individual' | 'plano_completo'>('plano_completo');
const search = ref('');
const priorityFilter = ref<PurchasePriority | null>(null);
const statusFilter = ref<string | null>(null);

const priorities = [
  { label: 'Alta', value: 'A' },
  { label: 'Média', value: 'M' },
  { label: 'Baixa', value: 'B' },
];
const classifications = ['Eletrônicos', 'Casa', 'Trabalho', 'Viagem', 'Lazer', 'Roupa', 'Saúde', 'Outros'];
const statuses = [
  { label: 'Planejado', value: 'planejado' },
  { label: 'Em pesquisa', value: 'em_pesquisa' },
  { label: 'Disponível', value: 'disponivel' },
  { label: 'Programado', value: 'programado' },
  { label: 'Comprado', value: 'comprado' },
  { label: 'Cancelado', value: 'cancelado' },
  { label: 'Arquivado', value: 'arquivado' },
];
const horizonOptions = [
  { label: '3 meses', value: 3 },
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
];
const projectionModes = [
  { label: 'Plano completo', value: 'plano_completo' },
  { label: 'Individual', value: 'individual' },
];

type ItemForm = {
  nome: string,
  descricao: string,
  classificacao: string,
  prioridade: PurchasePriority,
  valor_minimo: number,
  valor_maximo?: number | null,
  valor_referencia?: number | null,
  data_desejada?: Date | null,
  observacoes: string,
  status: PurchaseItem['status']
};
const blankItem = (): ItemForm => ({
  nome: '',
  descricao: '',
  classificacao: 'Outros',
  prioridade: 'M',
  valor_minimo: 0,
  valor_maximo: null,
  valor_referencia: null,
  data_desejada: null,
  observacoes: '',
  status: 'planejado',
});
const itemForm = ref<ItemForm>(blankItem());

type OptionForm = {
  nome_loja: string,
  descricao: string,
  link: string,
  valor: number,
  frete?: number | null,
  data_pesquisa: Date,
  observacao: string,
  disponivel: 'S' | 'N'
};
const blankOption = (): OptionForm => ({
  nome_loja: '',
  descricao: '',
  link: '',
  valor: 0,
  frete: null,
  data_pesquisa: new Date(),
  observacao: '',
  disponivel: 'S',
});
const optionForm = ref<OptionForm>(blankOption());
const initialOptionForm = ref<OptionForm>(blankOption());
const initialOptions = ref<OptionForm[]>([]);
const editingInitialOptionIndex = ref<number | null>(null);

const buyForm = ref({
  data_compra: new Date(),
  valor_pago: 0,
  loja: '',
  link: '',
  observacao: '',
  criar_conta: true,
  id_categoria: undefined as number | undefined,
  id_conta_bancaria: undefined as number | undefined,
  id_forma_pagamento: undefined as number | undefined,
  id_cartao_credito: undefined as number | undefined,
  parcelas_cartao: 1,
  opcao_id: undefined as number | undefined,
});

const activeProjection = computed<PurchaseProjection | undefined>(() => {
  if (!selectedItem.value) return undefined;
  return projectionMode.value === 'individual'
    ? selectedItem.value.projecao_individual
    : selectedItem.value.projecao_plano_completo;
});
const activeExpenseCategories = computed(() =>
  categories.value.filter((category) =>
    category.ativo === 'S' && ['D', 'A'].includes(category.tipo)
  )
);
const buyUsesCreditCard = computed(() =>
  paymentForms.value.find((form) => form.id === buyForm.value.id_forma_pagamento)?.descricao === 'CARTÃO DE CRÉDITO'
);
const selectedBuyCard = computed(() => creditCards.value.find((card) => card.id === buyForm.value.id_cartao_credito));
const buyInstallmentOptions = computed(() => Array.from(
  { length: selectedBuyCard.value?.limite_parcelas ?? 0 },
  (_, index) => ({ label: `${index + 1}x`, value: index + 1 })
));
watch(selectedBuyCard, (card) => {
  if (buyForm.value.parcelas_cartao > (card?.limite_parcelas ?? 0)) {
    buyForm.value.parcelas_cartao = 1;
  }
});
const filteredItems = computed(() => items.value.filter((item) => {
  const term = search.value.trim().toLocaleLowerCase();
  return (!term || item.nome.toLocaleLowerCase().includes(term) || item.classificacao.toLocaleLowerCase().includes(term))
    && (!priorityFilter.value || item.prioridade === priorityFilter.value)
    && (!statusFilter.value || item.status === statusFilter.value);
}));
const initialPriceRange = computed(() => calculatePurchaseOptionRange(initialOptions.value));
const hasInitialOptionDraft = computed(() => {
  const option = initialOptionForm.value;
  return Boolean(
    option.nome_loja.trim()
    || option.descricao.trim()
    || option.valor > 0
    || option.frete !== null && option.frete !== undefined
    || option.link.trim()
    || option.observacao.trim()
    || option.disponivel === 'N'
  );
});

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Não foi possível concluir a operação.';
}

function priorityLabel(value: string): string {
  return priorities.find((item) => item.value === value)?.label || value;
}
function statusLabel(value: string): string {
  return statuses.find((item) => item.value === value)?.label || value.replace(/_/g, ' ');
}
function formatDate(date?: string | null): string {
  return date ? moment(date).format('DD/MM/YYYY') : 'Sem previsão';
}

async function loadAll(): Promise<void> {
  loading.value = true;
  try {
    const [plan, config, categoryResponse, bankResponse, forms, cards] = await Promise.all([
      api.findPurchaseItems(),
      api.getFinancialSettings(),
      api.findCategories({ filter: { ativo: 'S' }, limit: 100 }),
      api.findBankAccounts({ filter: {} }),
      api.payments(),
      api.listCreditCards(),
    ]);
    items.value = plan.data;
    summary.value = plan.resumo;
    settings.value = config;
    categories.value = categoryResponse.data;
    bankAccounts.value = bankResponse.data;
    paymentForms.value = forms;
    creditCards.value = cards;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar', detail: errorMessage(error), life: 4500 });
  } finally {
    loading.value = false;
  }
}

function openCreate(): void {
  editingItemId.value = null;
  itemForm.value = blankItem();
  initialOptions.value = [];
  resetInitialOptionForm();
  itemDialog.value = true;
}

function openEdit(item: PurchaseItem): void {
  editingItemId.value = item.id ?? null;
  itemForm.value = {
    nome: item.nome,
    descricao: item.descricao || '',
    classificacao: item.classificacao,
    prioridade: item.prioridade,
    valor_minimo: item.valor_minimo_manual ?? item.valor_minimo,
    valor_maximo: item.valor_maximo_manual ?? item.valor_maximo,
    valor_referencia: item.valor_referencia,
    data_desejada: item.data_desejada ? moment(item.data_desejada).toDate() : null,
    observacoes: item.observacoes || '',
    status: item.status,
  };
  initialOptions.value = [];
  resetInitialOptionForm();
  itemDialog.value = true;
}

function resetInitialOptionForm(): void {
  editingInitialOptionIndex.value = null;
  initialOptionForm.value = blankOption();
}

function optionTotal(option: Pick<OptionForm, 'valor' | 'frete'>): number {
  return option.valor + (option.frete || 0);
}

function addInitialOption(): boolean {
  const option = initialOptionForm.value;
  if (!option.nome_loja.trim() || option.valor <= 0 || (option.link.trim() && !isSafePurchaseUrl(option.link.trim()))) {
    toast.add({ severity: 'warn', summary: 'Revise a opção', detail: 'Informe loja e valor. Se preencher o link, use uma URL HTTP/HTTPS válida.', life: 3500 });
    return false;
  }

  const normalized: OptionForm = {
    ...option,
    nome_loja: option.nome_loja.trim(),
    descricao: option.descricao.trim(),
    link: option.link.trim(),
    observacao: option.observacao.trim(),
    data_pesquisa: new Date(option.data_pesquisa),
  };
  if (editingInitialOptionIndex.value === null) {
    initialOptions.value.push(normalized);
  } else {
    initialOptions.value.splice(editingInitialOptionIndex.value, 1, normalized);
  }
  resetInitialOptionForm();
  return true;
}

function editInitialOption(index: number): void {
  const option = initialOptions.value[index];
  editingInitialOptionIndex.value = index;
  initialOptionForm.value = {
    ...option,
    data_pesquisa: new Date(option.data_pesquisa),
  };
}

function removeInitialOption(index: number): void {
  initialOptions.value.splice(index, 1);
  if (editingInitialOptionIndex.value === index) {
    resetInitialOptionForm();
  } else if (editingInitialOptionIndex.value !== null && editingInitialOptionIndex.value > index) {
    editingInitialOptionIndex.value -= 1;
  }
}

async function saveItem(): Promise<void> {
  if (!editingItemId.value && hasInitialOptionDraft.value && !addInitialOption()) {
    return;
  }
  const calculatedRange = editingItemId.value ? null : initialPriceRange.value;
  if (!itemForm.value.nome.trim()) {
    toast.add({ severity: 'warn', summary: 'Revise os campos', detail: 'O nome do item é obrigatório.', life: 3500 });
    return;
  }
  if (!calculatedRange && !isValidPriceRange(itemForm.value.valor_minimo, itemForm.value.valor_maximo)) {
    toast.add({ severity: 'warn', summary: 'Revise os campos', detail: 'Adicione uma opção disponível ou informe um valor mínimo maior que zero.', life: 3500 });
    return;
  }
  saving.value = true;
  const payload: Partial<PurchaseItem> = {
    ...itemForm.value,
    valor_minimo: calculatedRange?.minimum ?? itemForm.value.valor_minimo,
    valor_maximo: calculatedRange?.maximum ?? itemForm.value.valor_maximo,
    data_desejada: itemForm.value.data_desejada
      ? moment(itemForm.value.data_desejada).format('YYYY-MM-DD')
      : null,
    opcoes: editingItemId.value
      ? undefined
      : initialOptions.value.map((option) => ({
        ...option,
        data_pesquisa: moment(option.data_pesquisa).format('YYYY-MM-DD'),
      })),
  };
  try {
    if (editingItemId.value) {
      await api.updatePurchaseItem(editingItemId.value, payload);
    } else {
      await api.createPurchaseItem(payload);
    }
    itemDialog.value = false;
    toast.add({ severity: 'success', summary: 'Item salvo', detail: 'O plano foi recalculado.', life: 3000 });
    await loadAll();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail: errorMessage(error), life: 4500 });
  } finally {
    saving.value = false;
  }
}

async function openDetails(item: PurchaseItem): Promise<void> {
  if (!item.id) return;
  detailDialog.value = true;
  detailLoading.value = true;
  try {
    selectedItem.value = await api.getPurchaseItem(item.id);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar', detail: errorMessage(error), life: 4000 });
    detailDialog.value = false;
  } finally {
    detailLoading.value = false;
  }
}

async function refreshDetails(): Promise<void> {
  if (!selectedItem.value?.id) return;
  detailLoading.value = true;
  try {
    selectedItem.value = await api.getPurchaseItem(selectedItem.value.id);
    await loadAll();
  } finally {
    detailLoading.value = false;
  }
}

function confirmDelete(item: PurchaseItem): void {
  if (!item.id) return;
  confirm.require({
    header: 'Excluir item',
    message: `Deseja arquivar e remover “${item.nome}” do plano?`,
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.deletePurchaseItem(item.id!);
        toast.add({ severity: 'success', summary: 'Item excluído', detail: item.nome, life: 2500 });
        await loadAll();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error), life: 4000 });
      }
    },
  });
}

async function changeStatus(item: PurchaseItem, action: 'cancelar' | 'arquivar'): Promise<void> {
  if (!item.id) return;
  try {
    await api.changePurchaseItemStatus(item.id, action);
    await loadAll();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error), life: 4000 });
  }
}

function openOption(option?: PurchaseOption): void {
  if (option?.id) {
    editingOptionId.value = option.id;
    optionForm.value = {
      nome_loja: option.nome_loja,
      descricao: option.descricao || '',
      link: option.link || '',
      valor: option.valor,
      frete: option.frete,
      data_pesquisa: moment(option.data_pesquisa).toDate(),
      observacao: option.observacao || '',
      disponivel: option.disponivel,
    };
  } else {
    editingOptionId.value = null;
    optionForm.value = blankOption();
  }
  optionDialog.value = true;
}

async function saveOption(): Promise<void> {
  if (!selectedItem.value?.id) return;
  if (!optionForm.value.nome_loja.trim() || optionForm.value.valor <= 0
    || (optionForm.value.link.trim() && !isSafePurchaseUrl(optionForm.value.link.trim()))) {
    toast.add({ severity: 'warn', summary: 'Revise os campos', detail: 'Informe loja e valor. Se preencher o link, use uma URL HTTP/HTTPS válida.', life: 3500 });
    return;
  }
  saving.value = true;
  const payload: Partial<PurchaseOption> = {
    ...optionForm.value,
    link: optionForm.value.link.trim(),
    data_pesquisa: moment(optionForm.value.data_pesquisa).format('YYYY-MM-DD'),
  };
  try {
    if (editingOptionId.value) {
      await api.updatePurchaseOption(selectedItem.value.id, editingOptionId.value, payload);
    } else {
      await api.createPurchaseOption(selectedItem.value.id, payload);
    }
    optionDialog.value = false;
    toast.add({ severity: 'success', summary: 'Opção salva', detail: 'A faixa de preços foi recalculada.', life: 3000 });
    await refreshDetails();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail: errorMessage(error), life: 4500 });
  } finally {
    saving.value = false;
  }
}

function removeOption(option: PurchaseOption): void {
  if (!selectedItem.value?.id || !option.id) return;
  confirm.require({
    header: 'Excluir opção',
    message: `Remover a opção da loja “${option.nome_loja}”?`,
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    accept: async () => {
      await api.deletePurchaseOption(selectedItem.value!.id!, option.id!);
      await refreshDetails();
    },
  });
}

async function selectOption(option: PurchaseOption): Promise<void> {
  if (!selectedItem.value?.id || !option.id) return;
  await api.selectPurchaseOption(selectedItem.value.id, option.id);
  await refreshDetails();
}

function openBuy(item: PurchaseItem): void {
  selectedItem.value = item;
  const chosen = item.opcoes?.find((option) => option.selecionada === 'S');
  buyForm.value = {
    data_compra: new Date(),
    valor_pago: chosen?.valor_total ?? item.menor_opcao ?? item.valor_minimo,
    loja: chosen?.nome_loja || '',
    link: chosen?.link || '',
    observacao: '',
    criar_conta: true,
    id_categoria: undefined,
    id_conta_bancaria: bankAccounts.value.find((bank) => bank.principal === 'S')?.id ?? bankAccounts.value[0]?.id,
    id_forma_pagamento: paymentForms.value[0]?.id,
    id_cartao_credito: creditCards.value[0]?.id,
    parcelas_cartao: 1,
    opcao_id: chosen?.id,
  };
  buyDialog.value = true;
}

async function buyItem(): Promise<void> {
  if (!selectedItem.value?.id || buyForm.value.valor_pago <= 0) return;
  if (buyForm.value.link && !isSafePurchaseUrl(buyForm.value.link)) {
    toast.add({ severity: 'warn', summary: 'Link inválido', detail: 'Use uma URL HTTP ou HTTPS válida.', life: 3000 });
    return;
  }
  saving.value = true;
  try {
    await api.buyPurchaseItem(selectedItem.value.id, {
      ...buyForm.value,
      data_compra: moment(buyForm.value.data_compra).format('YYYY-MM-DD'),
    });
    buyDialog.value = false;
    detailDialog.value = false;
    toast.add({ severity: 'success', summary: 'Compra registrada', detail: !buyForm.value.criar_conta ? 'O item foi marcado como comprado.' : buyUsesCreditCard.value ? 'A compra foi incluída nas faturas do cartão.' : 'O item e o saldo foram atualizados.', life: 3500 });
    await loadAll();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao registrar compra', detail: errorMessage(error), life: 4500 });
  } finally {
    saving.value = false;
  }
}

async function saveSettings(): Promise<void> {
  saving.value = true;
  try {
    settings.value = await api.updateFinancialSettings(settings.value);
    settingsOpen.value = false;
    toast.add({ severity: 'success', summary: 'Reserva atualizada', detail: 'Todas as projeções foram recalculadas.', life: 3000 });
    await loadAll();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro', detail: errorMessage(error), life: 4000 });
  } finally {
    saving.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <section class="purchase-page app-page">
    <div class="list-header">
      <div>
        <p class="eyebrow">Planejamento financeiro</p>
        <h2>Plano de compras</h2>
        <span>Projeções consideram contas pendentes, sem incluir o saldo bancário.</span>
      </div>
      <div class="page-actions">
        <Button label="Reserva e horizonte" icon="pi pi-shield" severity="secondary" class="p-button-sm" @click="settingsOpen = true" />
        <Button label="Novo item" icon="pi pi-plus" class="p-button-sm" @click="openCreate" />
      </div>
    </div>

    <div v-if="summary.alertas.length" class="alerts">
      <Message v-for="alert in summary.alertas" :key="alert" severity="warn" :closable="false">{{ alert }}</Message>
    </div>

    <div class="summary-grid">
      <Card><template #content><small>Planejados</small><strong>{{ summary.total_itens_planejados }}</strong></template></Card>
      <Card><template #content><small>Disponíveis agora</small><strong class="success">{{ summary.itens_disponiveis_agora }}</strong></template></Card>
      <Card><template #content><small>Meses futuros</small><strong>{{ summary.itens_meses_futuros }}</strong></template></Card>
      <Card><template #content><small>Comprados</small><strong>{{ summary.itens_comprados }}</strong></template></Card>
      <Card><template #content><small>Menor custo possível</small><strong>{{ utils.formatCurrency(summary.menor_custo_possivel) }}</strong></template></Card>
      <Card><template #content><small>Reserva mínima</small><strong>{{ utils.formatCurrency(summary.reserva_minima) }}</strong></template></Card>
      <Card class="available-card"><template #content><small>Disponível para compras</small><strong>{{ utils.formatCurrency(summary.saldo_disponivel_compras) }}</strong></template></Card>
      <Card><template #content><small>Próxima sugestão</small><strong class="text-value">{{ summary.proxima_compra_sugerida?.nome || 'Nenhuma' }}</strong></template></Card>
    </div>

    <div class="filters orbit-panel">
      <InputText v-model="search" placeholder="Pesquisar item ou classificação" />
      <Select v-model="priorityFilter" :options="priorities" optionLabel="label" optionValue="value"
        showClear placeholder="Todas as prioridades" />
      <Select v-model="statusFilter" :options="statuses" optionLabel="label" optionValue="value"
        showClear placeholder="Todos os status" />
    </div>

    <div v-if="loading" class="loading-state orbit-panel"><ProgressSpinner strokeWidth="4" /><span>Calculando seu plano...</span></div>
    <div v-else-if="!filteredItems.length" class="empty-state orbit-panel">
      <i class="pi pi-shopping-cart"></i><strong>Nenhum item no plano</strong>
      <span>Adicione um desejo para receber uma projeção segura de compra.</span>
    </div>
    <div v-else class="responsive-table">
      <DataTable :value="filteredItems" stripedRows>
            <Column header="Item">
              <template #body="{ data }">
                <div class="item-name"><strong>{{ data.nome }}</strong><small>{{ data.classificacao }}</small></div>
              </template>
            </Column>
            <Column header="Prioridade">
              <template #body="{ data }">
                <Tag :value="priorityLabel(data.prioridade)"
                  :severity="data.prioridade === 'A' ? 'danger' : data.prioridade === 'M' ? 'warn' : 'info'" />
              </template>
            </Column>
            <Column header="Faixa de preço">
              <template #body="{ data }">
                <span>{{ utils.formatCurrency(data.valor_minimo) }}</span>
                <small v-if="data.valor_maximo"> – {{ utils.formatCurrency(data.valor_maximo) }}</small>
                <small class="option-count">{{ data.quantidade_opcoes || 0 }} opção(ões)</small>
              </template>
            </Column>
            <Column header="Previsão">
              <template #body="{ data }">
                <Tag :value="data.projecao?.pode_comprar_agora ? 'Pode comprar agora' : formatDate(data.projecao?.data_sugerida)"
                  :severity="data.projecao?.pode_comprar_agora ? 'success' : data.projecao?.data_sugerida ? 'info' : 'secondary'" />
                <small class="projection-reason">{{ data.projecao?.motivo }}</small>
              </template>
            </Column>
            <Column header="Status">
              <template #body="{ data }"><Tag :value="statusLabel(data.status)" severity="secondary" /></template>
            </Column>
            <Column header="Ações">
              <template #body="{ data }">
                <div class="table-actions">
                  <Button v-tooltip.top="'Ver detalhes'" icon="pi pi-eye" text rounded aria-label="Ver detalhes" @click="openDetails(data)" />
                  <Button v-if="data.comprado !== 'S'" v-tooltip.top="'Editar item'" icon="pi pi-pencil" text rounded aria-label="Editar item" @click="openEdit(data)" />
                  <Button v-if="data.comprado !== 'S'" icon="pi pi-check-circle" text rounded severity="success"
                    v-tooltip.top="'Marcar como comprado'" aria-label="Marcar como comprado" @click="openBuy(data)" />
                  <Button v-tooltip.top="'Excluir item'" icon="pi pi-trash" text rounded severity="danger" aria-label="Excluir item" @click="confirmDelete(data)" />
                </div>
              </template>
            </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="itemDialog" modal :header="editingItemId ? 'Editar item' : 'Novo item'" class="purchase-dialog">
      <form class="form-grid" @submit.prevent="saveItem">
        <div class="full"><label class="label">Nome *</label><InputText v-model="itemForm.nome" class="w-full" /></div>
        <div class="full"><label class="label">Descrição</label><Textarea v-model="itemForm.descricao" class="w-full" rows="3" /></div>
        <div><label class="label">Classificação *</label><Select v-model="itemForm.classificacao" :options="classifications" class="w-full" /></div>
        <div><label class="label">Prioridade *</label><Select v-model="itemForm.prioridade" :options="priorities" optionLabel="label" optionValue="value" class="w-full" /></div>
        <template v-if="editingItemId || !initialPriceRange">
          <div><label class="label">Valor mínimo *</label><InputNumber v-model="itemForm.valor_minimo" mode="currency" currency="BRL" locale="pt-BR" class="w-full" :min="0.01" /></div>
          <div><label class="label">Valor máximo</label><InputNumber v-model="itemForm.valor_maximo" mode="currency" currency="BRL" locale="pt-BR" class="w-full" :min="0.01" /></div>
        </template>
        <section v-if="!editingItemId" class="initial-options full">
          <div class="initial-options-header">
            <div>
              <h4>Opções de compra</h4>
              <small>Adicione as ofertas pesquisadas. Frete + valor definem automaticamente a faixa do item.</small>
            </div>
            <Tag v-if="initialPriceRange" severity="success" :value="`${utils.formatCurrency(initialPriceRange.minimum)} – ${utils.formatCurrency(initialPriceRange.maximum)}`" />
          </div>
          <div class="option-editor">
            <div><label class="label">Loja *</label><InputText v-model="initialOptionForm.nome_loja" class="w-full" /></div>
            <div><label class="label">Nome da opção</label><InputText v-model="initialOptionForm.descricao" class="w-full" /></div>
            <div class="full"><label class="label">Link (opcional)</label><InputText v-model="initialOptionForm.link" class="w-full" placeholder="https://exemplo.com/produto" /></div>
            <div><label class="label">Valor *</label><InputNumber v-model="initialOptionForm.valor" mode="currency" currency="BRL" locale="pt-BR" class="option-price-input" inputClass="w-full" :min="0.01" /></div>
            <div><label class="label">Frete</label><InputNumber v-model="initialOptionForm.frete" mode="currency" currency="BRL" locale="pt-BR" class="option-price-input" inputClass="w-full" :min="0" /></div>
            <div><label class="label" for="data-pesquisa-inicial">Data da pesquisa</label><DatePicker inputId="data-pesquisa-inicial" v-model="initialOptionForm.data_pesquisa" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" class="w-full" showIcon iconDisplay="input" fluid /></div>
            <div class="option-availability"><label class="label">Disponível</label><ToggleSwitch v-model="initialOptionForm.disponivel" trueValue="S" falseValue="N" /></div>
            <div class="full"><label class="label">Observação</label><Textarea v-model="initialOptionForm.observacao" class="w-full" rows="2" /></div>
            <div class="full option-editor-actions">
              <Button v-if="editingInitialOptionIndex !== null" type="button" label="Cancelar edição" severity="secondary" text @click="resetInitialOptionForm" />
              <Button type="button" :label="editingInitialOptionIndex === null ? 'Adicionar opção' : 'Atualizar opção'" icon="pi pi-plus" @click="addInitialOption" />
            </div>
          </div>
          <div v-if="initialOptions.length" class="initial-option-list">
            <div v-for="(option, index) in initialOptions" :key="`${option.nome_loja}-${index}`" class="initial-option-row">
              <div>
                <strong>{{ option.nome_loja }}</strong>
                <small v-if="option.descricao || option.link">{{ option.descricao || option.link }}</small>
              </div>
              <Tag :value="option.disponivel === 'S' ? 'Disponível' : 'Indisponível'" :severity="option.disponivel === 'S' ? 'info' : 'secondary'" />
              <strong>{{ utils.formatCurrency(optionTotal(option)) }}</strong>
              <div class="table-actions">
                <Button v-tooltip.top="'Editar opção'" type="button" icon="pi pi-pencil" text rounded aria-label="Editar opção" @click="editInitialOption(index)" />
                <Button v-tooltip.top="'Remover opção'" type="button" icon="pi pi-trash" text rounded severity="danger" aria-label="Remover opção" @click="removeInitialOption(index)" />
              </div>
            </div>
          </div>
          <Message v-else severity="secondary" :closable="false">Nenhuma opção adicionada. Nesse caso, informe o valor mínimo manual acima.</Message>
          <Message v-if="initialOptions.length && !initialPriceRange" severity="warn" :closable="false">Não há opção disponível para calcular a faixa. Informe o valor mínimo manual acima.</Message>
        </section>
        <div><label class="label">Valor de referência</label><InputNumber v-model="itemForm.valor_referencia" mode="currency" currency="BRL" locale="pt-BR" class="w-full" /></div>
        <div><label class="label" for="data-desejada">Data desejada</label><DatePicker inputId="data-desejada" v-model="itemForm.data_desejada" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" class="w-full" showIcon iconDisplay="input" fluid /></div>
        <div v-if="editingItemId"><label class="label">Status</label><Select v-model="itemForm.status" :options="statuses" optionLabel="label" optionValue="value" class="w-full" /></div>
        <div class="full"><label class="label">Observações</label><Textarea v-model="itemForm.observacoes" class="w-full" rows="3" /></div>
      </form>
      <template #footer><Button label="Cancelar" severity="secondary" @click="itemDialog = false" /><Button label="Salvar" :loading="saving" :disabled="saving" @click="saveItem" /></template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" modal header="Detalhes do planejamento" class="detail-dialog">
      <div v-if="detailLoading" class="loading-state"><ProgressSpinner /></div>
      <div v-else-if="selectedItem" class="detail-content">
        <div class="detail-header">
          <div><h3>{{ selectedItem.nome }}</h3><span>{{ selectedItem.classificacao }}</span></div>
          <Tag :value="priorityLabel(selectedItem.prioridade)"
            :severity="selectedItem.prioridade === 'A' ? 'danger' : selectedItem.prioridade === 'M' ? 'warn' : 'info'" />
        </div>
        <SelectButton v-model="projectionMode" :options="projectionModes" optionLabel="label" optionValue="value" :allowEmpty="false" />
        <Message v-if="activeProjection" :severity="activeProjection.pode_comprar_agora ? 'success' : activeProjection.data_sugerida ? 'info' : 'warn'" :closable="false">
          <strong>{{ activeProjection.motivo }}</strong><br />
          Valor analisado: {{ utils.formatCurrency(activeProjection.valor_usado_no_calculo) }} ·
          Data segura: {{ formatDate(activeProjection.data_sugerida) }} ·
          Reserva: {{ utils.formatCurrency(activeProjection.reserva_minima) }}<br />
          Datas de compra avaliadas até {{ formatDate(activeProjection.horizonte_analisado_ate) }}, considerando as contas pendentes e a reserva mínima.
        </Message>
        <div v-if="activeProjection" class="projection-values">
          <div><small>Saldo antes</small><strong>{{ utils.formatCurrency(activeProjection.saldo_antes_da_compra || 0) }}</strong></div>
          <div><small>Saldo após</small><strong>{{ utils.formatCurrency(activeProjection.saldo_apos_compra || 0) }}</strong></div>
          <div><small>Livre após compra</small><strong>{{ utils.formatCurrency(activeProjection.saldo_livre_apos_compra || 0) }}</strong></div>
        </div>
        <div v-if="activeProjection?.data_sugerida && activeProjection.saldo_fim_mes_apos_compra !== null" class="month-safety">
          <strong>Fechamento do mês da compra ({{ formatDate(moment(activeProjection.data_sugerida).endOf('month').format('YYYY-MM-DD')) }})</strong>
          <span>Saldo no fim do mês: {{ utils.formatCurrency(activeProjection.saldo_fim_mes_apos_compra) }}</span>
          <span>Menor saldo durante o mês: {{ utils.formatCurrency(activeProjection.saldo_minimo_mes_apos_compra || 0) }}</span>
        </div>
        <div class="section-title"><h4>Opções pesquisadas</h4><Button label="Adicionar opção" icon="pi pi-plus" size="small" @click="openOption()" /></div>
        <div v-if="!selectedItem.opcoes?.length" class="mini-empty">Nenhuma opção cadastrada. Os valores manuais estão sendo usados.</div>
        <div v-else class="responsive-table">
          <DataTable :value="selectedItem.opcoes" size="small">
            <Column field="nome_loja" header="Loja" />
            <Column header="Total"><template #body="{ data }">{{ utils.formatCurrency(data.valor_total) }}</template></Column>
            <Column header="Pesquisa"><template #body="{ data }">{{ formatDate(data.data_pesquisa) }}</template></Column>
            <Column header="Situação">
              <template #body="{ data }">
                <Tag :value="data.selecionada === 'S' ? 'Selecionada' : data.disponivel === 'S' ? 'Disponível' : 'Indisponível'"
                  :severity="data.selecionada === 'S' ? 'success' : data.disponivel === 'S' ? 'info' : 'secondary'" />
              </template>
            </Column>
            <Column header="Link"><template #body="{ data }"><a v-if="data.link" :href="data.link" target="_blank" rel="noopener noreferrer" class="simple-link">Abrir <i class="pi pi-external-link"></i></a><span v-else>—</span></template></Column>
            <Column header="Ações">
              <template #body="{ data }"><div class="table-actions">
                <Button v-tooltip.top="'Selecionar opção'" icon="pi pi-check" text rounded aria-label="Selecionar opção" @click="selectOption(data)" />
                <Button v-tooltip.top="'Editar opção'" icon="pi pi-pencil" text rounded aria-label="Editar opção" @click="openOption(data)" />
                <Button v-tooltip.top="'Excluir opção'" icon="pi pi-trash" text rounded severity="danger" aria-label="Excluir opção" @click="removeOption(data)" />
              </div></template>
            </Column>
          </DataTable>
        </div>
        <div v-if="activeProjection?.linha_tempo.length" class="timeline">
          <h4>Linha do tempo financeira</h4>
          <div v-for="point in activeProjection.linha_tempo" :key="point.data" class="timeline-point">
            <span>{{ formatDate(point.data) }}</span>
            <small>+ {{ utils.formatCurrency(point.receitas) }} / − {{ utils.formatCurrency(point.despesas) }}</small>
            <strong>{{ utils.formatCurrency(point.saldo) }}</strong>
          </div>
        </div>
        <div v-if="selectedItem.comprado === 'S'" class="purchase-data">
          <h4>Compra realizada</h4>
          <span>{{ formatDate(selectedItem.data_compra) }} · {{ utils.formatCurrency(selectedItem.valor_pago || 0) }} · {{ selectedItem.loja_escolhida || 'Loja não informada' }}</span>
        </div>
      </div>
      <template #footer>
        <Button v-if="selectedItem?.comprado !== 'S'" label="Cancelar item" severity="secondary" @click="changeStatus(selectedItem!, 'cancelar'); detailDialog = false" />
        <Button v-if="selectedItem?.comprado !== 'S'" label="Marcar como comprado" icon="pi pi-check-circle" @click="openBuy(selectedItem!)" />
        <Button label="Fechar" severity="secondary" @click="detailDialog = false" />
      </template>
    </Dialog>

    <Dialog v-model:visible="optionDialog" modal :header="editingOptionId ? 'Editar opção' : 'Nova opção de preço'" class="option-dialog">
      <form class="form-grid" @submit.prevent="saveOption">
        <div><label class="label">Loja *</label><InputText v-model="optionForm.nome_loja" class="w-full" /></div>
        <div><label class="label">Nome da opção</label><InputText v-model="optionForm.descricao" class="w-full" /></div>
        <div class="full"><label class="label">Link (opcional)</label><InputText v-model="optionForm.link" class="w-full" placeholder="https://exemplo.com/produto" /></div>
        <div><label class="label">Valor *</label><InputNumber v-model="optionForm.valor" mode="currency" currency="BRL" locale="pt-BR" class="option-price-input" inputClass="w-full" :min="0.01" /></div>
        <div><label class="label">Frete</label><InputNumber v-model="optionForm.frete" mode="currency" currency="BRL" locale="pt-BR" class="option-price-input" inputClass="w-full" :min="0" /></div>
        <div><label class="label" for="data-pesquisa">Data da pesquisa</label><DatePicker inputId="data-pesquisa" v-model="optionForm.data_pesquisa" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" class="w-full" showIcon iconDisplay="input" fluid /></div>
        <div><label class="label">Disponível</label><ToggleSwitch v-model="optionForm.disponivel" trueValue="S" falseValue="N" /></div>
        <div class="full"><label class="label">Observação</label><Textarea v-model="optionForm.observacao" class="w-full" rows="3" /></div>
      </form>
      <template #footer><Button label="Cancelar" severity="secondary" @click="optionDialog = false" /><Button label="Salvar opção" :loading="saving" @click="saveOption" /></template>
    </Dialog>

    <Dialog v-model:visible="buyDialog" modal header="Marcar como comprado" class="buy-dialog">
      <form class="form-grid" @submit.prevent="buyItem">
        <div><label class="label" for="data-compra">Data da compra *</label><DatePicker inputId="data-compra" v-model="buyForm.data_compra" dateFormat="dd/mm/yy" placeholder="dd/mm/aaaa" class="w-full" showIcon iconDisplay="input" fluid /></div>
        <div><label class="label">{{ buyUsesCreditCard ? 'Valor da compra *' : 'Valor pago *' }}</label><InputNumber v-model="buyForm.valor_pago" mode="currency" currency="BRL" locale="pt-BR" class="w-full" :min="0.01" /></div>
        <div><label class="label">Loja</label><InputText v-model="buyForm.loja" class="w-full" /></div>
        <div><label class="label">Opção escolhida</label><Select v-model="buyForm.opcao_id" :options="selectedItem?.opcoes || []" optionLabel="nome_loja" optionValue="id" showClear class="w-full" /></div>
        <div class="full"><label class="label">Link</label><InputText v-model="buyForm.link" class="w-full" /></div>
        <div class="full create-bill-toggle"><div><strong>Criar despesa financeira</strong><small>{{ buyUsesCreditCard ? 'Distribui a compra nas faturas do cartão.' : 'Registra a compra como paga e atualiza o saldo bancário.' }}</small></div><ToggleSwitch v-model="buyForm.criar_conta" /></div>
        <template v-if="buyForm.criar_conta">
          <div><label class="label">Categoria financeira</label><Select v-model="buyForm.id_categoria" :options="activeExpenseCategories" optionLabel="nome" optionValue="id" showClear class="w-full" /></div>
          <div v-if="!buyUsesCreditCard"><label class="label">Conta bancária *</label><Select v-model="buyForm.id_conta_bancaria" :options="bankAccounts" optionLabel="descricao" optionValue="id" class="w-full" /></div>
          <div><label class="label">Forma de pagamento *</label><Select v-model="buyForm.id_forma_pagamento" :options="paymentForms" optionLabel="descricao" optionValue="id" class="w-full" /></div>
          <template v-if="buyUsesCreditCard">
            <div><label class="label">Cartão de crédito *</label><Select v-model="buyForm.id_cartao_credito" :options="creditCards" optionLabel="nome" optionValue="id" class="w-full" /></div>
            <div><label class="label">Parcelas no cartão *</label><Select v-model="buyForm.parcelas_cartao" :options="buyInstallmentOptions" optionLabel="label" optionValue="value" :disabled="!selectedBuyCard" placeholder="Selecione o cartão" class="w-full" /></div>
          </template>
        </template>
        <div class="full"><label class="label">Observação</label><Textarea v-model="buyForm.observacao" class="w-full" rows="3" /></div>
      </form>
      <template #footer><Button label="Cancelar" severity="secondary" @click="buyDialog = false" /><Button label="Confirmar compra" icon="pi pi-check" :loading="saving" @click="buyItem" /></template>
    </Dialog>

    <Dialog v-model:visible="settingsOpen" modal header="Reserva e projeção" class="settings-dialog">
      <div class="settings-form">
        <Message severity="info" :closable="false">A reserva é um piso protegido, não uma despesa mensal. Ela nunca é acumulada entre os meses.</Message>
        <div><label class="label">Reserva mínima</label><InputNumber v-model="settings.reserva_minima" mode="currency" currency="BRL" locale="pt-BR" class="w-full" :min="0" /></div>
        <div class="setting-toggle"><div><strong>Proteger reserva no planejamento</strong><small>Desative apenas para simulações sem saldo protegido.</small></div><ToggleSwitch v-model="settings.utilizar_reserva" trueValue="S" falseValue="N" /></div>
        <div><label class="label">Horizonte mínimo</label><Select v-model="settings.horizonte_meses" :options="horizonOptions" optionLabel="label" optionValue="value" class="w-full" /><small>A projeção se estende até a última conta pendente cadastrada, mesmo em outro ano.</small></div>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" @click="settingsOpen = false" /><Button label="Salvar e recalcular" :loading="saving" @click="saveSettings" /></template>
    </Dialog>
  </section>
</template>

<style scoped lang="scss">
.purchase-page { align-content: start; gap: .75rem; }
.detail-header, .section-title, .setting-toggle, .create-bill-toggle { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; }
.alerts { display: grid; gap: .35rem; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .6rem; }
.summary-grid small, .summary-grid strong { display: block; }
.summary-grid small { color: var(--app-text-muted); font-size: .7rem; font-weight: 800; }
.summary-grid strong { margin-top: .25rem; font-size: 1.05rem; color: var(--app-text); }
.summary-grid .success, .available-card strong { color: var(--orbit-cyan); }
.summary-grid .text-value { font-size: .85rem; }
.filters { display: grid; grid-template-columns: minmax(15rem, 1fr) 12rem 13rem; gap: .65rem; padding: .75rem; }
.item-name { display: grid; min-width: 10rem; gap: .15rem; }
.item-name small, .option-count, .projection-reason { display: block; color: var(--app-text-muted); font-size: .7rem; }
.option-count { margin-top: .2rem; }
.projection-reason { max-width: 19rem; margin-top: .3rem; line-height: 1.25; }
.table-actions { display: flex; }
.loading-state { min-height: 12rem; display: grid; place-items: center; align-content: center; gap: .65rem; color: var(--app-text-muted); }
.loading-state :deep(.p-progressspinner) { width: 2.5rem; height: 2.5rem; }
.empty-state i { font-size: 2rem; color: var(--orbit-purple); }
.empty-state strong, .empty-state span { display: block; margin-top: .35rem; }
.detail-content { display: grid; gap: .85rem; }
.detail-header h3, .detail-header span { margin: 0; }
.detail-header span { color: var(--app-text-muted); font-size: .78rem; }
.projection-values { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; }
.projection-values div { padding: .7rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-surface-soft); }
.projection-values small, .projection-values strong { display: block; }
.projection-values small { color: var(--app-text-muted); font-size: .7rem; }
.month-safety { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .35rem 1rem; padding: .85rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-surface-soft); }
.month-safety strong { grid-column: 1 / -1; }
.month-safety span { color: var(--app-text-muted); font-size: .85rem; }
.section-title h4, .timeline h4, .purchase-data h4 { margin: 0; }
.mini-empty, .purchase-data { padding: 1rem; border: 1px dashed var(--app-border); border-radius: var(--app-radius); color: var(--app-text-muted); }
.timeline { display: grid; gap: .35rem; }
.timeline-point { display: grid; grid-template-columns: 7rem 1fr auto; gap: .5rem; padding: .5rem .65rem; border-left: 2px solid var(--orbit-purple); background: var(--app-surface-soft); }
.timeline-point small { color: var(--app-text-muted); }
.settings-form { display: grid; gap: 1rem; }
.setting-toggle small, .create-bill-toggle small { display: block; margin-top: .15rem; color: var(--app-text-muted); }
.initial-options { display: grid; gap: .75rem; padding: .85rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-surface-soft); }
.initial-options-header { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.initial-options-header h4 { margin: 0 0 .15rem; }
.initial-options-header small { color: var(--app-text-muted); }
.option-editor { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; padding-top: .75rem; border-top: 1px solid var(--app-border); }
.option-editor > div, :global(.option-dialog .form-grid > div) { min-width: 0; }
:global(.option-price-input), :global(.option-price-input .p-inputnumber-input) { width: 100%; min-width: 0; }
.option-editor .full { grid-column: 1 / -1; }
.option-availability { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: .5rem; padding-bottom: .55rem; }
.option-editor-actions { display: flex; justify-content: flex-end; gap: .5rem; }
.initial-option-list { display: grid; gap: .4rem; }
.initial-option-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center; gap: .65rem; padding: .5rem .65rem; border: 1px solid var(--app-border); border-radius: var(--app-radius); background: var(--app-surface); }
.initial-option-row small { display: block; max-width: 25rem; overflow: hidden; color: var(--app-text-muted); text-overflow: ellipsis; white-space: nowrap; }
:global(.p-dialog.detail-dialog:not(.p-confirmdialog)) { --app-dialog-width: 84rem; --app-dialog-height: 55rem; }
.purchase-dialog { --app-dialog-width: 58rem; --app-dialog-height: 48rem; }
.option-dialog, .buy-dialog { --app-dialog-width: 52rem; --app-dialog-height: 46rem; }
@media (max-width: 1024px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 700px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filters, .projection-values, .month-safety { grid-template-columns: 1fr; }
  .option-editor, .initial-option-row { grid-template-columns: 1fr; }
  .initial-options-header { align-items: flex-start; flex-direction: column; }
  .timeline-point { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  :global(.p-dialog.detail-dialog:not(.p-confirmdialog)) {
    --app-dialog-width: calc(100vw - 1rem);
    --app-dialog-height: calc(100dvh - var(--app-safe-area-top) - var(--app-safe-area-bottom) - 1rem);
  }
}
@media (max-width: 360px) {
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
