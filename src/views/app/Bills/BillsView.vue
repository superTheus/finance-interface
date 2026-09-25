<script setup lang="ts">
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { BankAccounts, Bills, BillsRequest, Categories, CreditCard, FilterBill, PartialBills, PaymentsForms, ResumeBills } from '@/types/types';
import { computed, ref, watch } from 'vue';
import moment from 'moment';
import { Utils } from '@/services/utils';
import ModalFilters from '@/components/ModalFilters.vue';
import ValuesTotals from '@/components/ValuesTotals.vue';
import type { MenuItem } from 'primevue/menuitem';
import { mounths } from '@/constants/constants';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

const user = useUserStore();
const confirm = useConfirm();
const toast = useToast();
const api = new Api();
const utils = new Utils();
const bills = ref<Bills[]>([]);
const page = ref(0);
const total = ref(0);
const rowsPerPage = 5;
const showFilter = ref(false);
const showDialogPayment = ref(false);
const showDialogForm = ref(false);
const isEditMode = ref(false);
const forms = ref<PaymentsForms[]>([]);
const creditCards = ref<CreditCard[]>([]);
const bankAccounts = ref<BankAccounts[]>([]);
const categories = ref<Categories[]>([]);
const accountSelected = ref<Bills>();
const accountToEdit = ref<Bills | null>(null);
const accountToPay = ref<Bills | null>(null);
const saving = ref(false);
const loadingBills = ref(false);
let latestBillsRequest = 0;

const formAccount = ref<{
  tipo: "D" | "R",
  titulo: string;
  valor: number;
  vencimento?: Date;
  descricao?: string;
  pagoOptions: {
    name: string;
    value: string;
  }[];
  status: 'PA' | 'PE';
  data_pagamento?: Date;
  valor_pago?: number;
  contaParcelada?: "S" | "N";
  contaFrequente?: "S" | "N";
  total_parcelas?: number;
  frequencia?: number;
  formaPagamento?: PaymentsForms;
  creditCard?: CreditCard;
  cardInstallments: number;
  dataCompra: Date;
  bankAccount?: BankAccounts;
  category?: Categories;
  valorPago: number;
  dataPagamento?: Date;
}>({
  tipo: "D",
  titulo: '',
  valor: 0,
  status: 'PE',
  pagoOptions: [
    { name: 'Pago', value: 'PA' },
    { name: 'Pendente', value: 'PE' }
  ],
  contaParcelada: "N",
  contaFrequente: "N",
  frequencia: 2,
  total_parcelas: 2,
  valorPago: 0,
  cardInstallments: 1,
  dataCompra: moment().toDate(),
});

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0,
    deletado: 'N',
  },
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD'),
  },
  limit: rowsPerPage,
  offset: 0,
  order: {
    cols: ["vencimento"],
    direction: "ASC"
  }
});

const filterOptions = ref<FilterBill>({
  period: {
    label: 'Mês Atual',
    value: 1
  },
  month: {
    label: mounths.find(m => m.value === moment().month() + 1)?.label || '',
    value: mounths.find(m => m.value === moment().month() + 1)?.value || 0
  },
  radioTypeFilterPeriod: 'mounth',
  statusFilter: 'TO',
  type: 'TO',
  search: '',
  categoryIds: [],
  datePeriod: [moment().startOf('month').toDate(), moment().toDate()]
});

const resumeBills = ref<ResumeBills>({
  quantidadeFaltaPagar: 0,
  quantidadePaga: 0,
  quantidadeTotalPagar: 0,
  quantidadeFaltaReceber: 0,
  quantidadeRecebida: 0,
  quantidadeTotalReceber: 0,
  totalPagar: 0,
  totalFaltaPagar: 0,
  totalPago: 0,
  totalReceber: 0,
  totalFaltaReceber: 0,
  totalRecebido: 0,
  saldo: 0
});

const items = ref<{
  data: Bills;
  items: MenuItem[];
}[]>();

const availableCategories = computed(() => categories.value.filter((category) =>
  category.ativo === 'S' && [formAccount.value.tipo, 'A'].includes(category.tipo)
));
const isCreditPayment = computed(() => formAccount.value.formaPagamento?.descricao === 'CARTÃO DE CRÉDITO');

const formPayment = ref<{
  formaPagamento: PaymentsForms;
  bankAccount: BankAccounts;
  valorPago: number;
  dataPagamento: Date;
  creditCard?: CreditCard;
  cardInstallments: number;
}>({
  formaPagamento: {} as PaymentsForms,
  bankAccount: {} as BankAccounts,
  dataPagamento: moment().toDate(),
  valorPago: 0,
  cardInstallments: 1,
});
const isCreditOnPayment = computed(() => formPayment.value.formaPagamento?.descricao === 'CARTÃO DE CRÉDITO');
const availablePaymentForms = computed(() =>
  accountSelected.value?.tipo === 'R' || accountSelected.value?.origem_cartao === 'fatura'
    ? forms.value.filter((form) => form.descricao !== 'CARTÃO DE CRÉDITO')
    : forms.value
);

function accountError(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: string }).message);
  }
  return 'Não foi possível salvar a conta.';
}

const ChipsFilter = ref<{
  label: string;
  data: FilterBill;
  remove: () => void;
}[]>([{
  label: `Mês Atual`,
  data: filterOptions.value,
  remove: () => {
    ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.period.value !== filterOptions.value.period.value);
    applyFilter({
      ...filterOptions.value,
      period: {
        label: 'Mês Atual',
        value: 1
      }
    });
  }
}]);

async function loadBills(): Promise<void> {
  const requestId = ++latestBillsRequest;
  const requestedOffset = filter.value.offset || 0;
  const dateRange = filter.value.date_ranger || {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD'),
  };

  loadingBills.value = true;

  try {
    const response = await api.findBills({
      filter: {
        ...filter.value.filter,
        vencimento: {
          BETWEEN: [dateRange.start_date, dateRange.end_date],
        },
      },
      limit: filter.value.limit,
      offset: requestedOffset,
      order: filter.value.order,
      search: filter.value.search,
    });

    if (requestId !== latestBillsRequest) return;

    const rows = Array.isArray(response.data) ? response.data : [];
    const recordsTotal = Number(response.total) || 0;

    if (!rows.length && recordsTotal > 0 && requestedOffset > 0) {
      page.value = 0;
      filter.value.offset = 0;
      await loadBills();
      return;
    }

    total.value = recordsTotal;
    bills.value = rows;
  } catch (error) {
    if (requestId !== latestBillsRequest) return;

    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar contas',
      detail: error instanceof Error ? error.message : 'Não foi possível carregar a listagem.',
      life: 4000,
    });
  } finally {
    if (requestId === latestBillsRequest) loadingBills.value = false;
  }
}

function loadResumes() {
  api.resumes({
    inicio: filter.value.date_ranger?.start_date || moment().startOf('month').format('YYYY-MM-DD'),
    fim: filter.value.date_ranger?.end_date || moment().endOf('month').format('YYYY-MM-DD'),
    usuario: filter.value.filter?.id_usuario || user.user?.id || 0
  }).then((data) => {
    resumeBills.value = data;
  }).catch(() => {
    resumeBills.value = {
      quantidadeFaltaPagar: 0,
      quantidadePaga: 0,
      quantidadeTotalPagar: 0,
      quantidadeFaltaReceber: 0,
      quantidadeRecebida: 0,
      quantidadeTotalReceber: 0,
      totalPagar: 0,
      totalFaltaPagar: 0,
      totalPago: 0,
      totalReceber: 0,
      totalFaltaReceber: 0,
      totalRecebido: 0,
      saldo: 0
    }
  });
}

function loadAllData() {
  loadBills();
  loadResumes();
  Promise.all([
    api.payments(),
    api.findBankAccounts({
      filter: {
        id_usuario: user.user?.id || 0
      }
    }),
    api.findCategories({ filter: { ativo: 'S' }, limit: 100 }),
    api.listCreditCards()
  ]).then(([payments, accounts, categoryResponse, cards]) => {
    forms.value = payments;
    bankAccounts.value = accounts.data;
    categories.value = categoryResponse.data;
    creditCards.value = cards;

    formPayment.value.formaPagamento = payments[0];
    formPayment.value.bankAccount = accounts.data.find((account) => account.principal === 'S') || accounts.data[0];
  });
}

const createBill = () => {
  saving.value = true;
  const bill: Bills = {
    id_usuario: user.user?.id || 0,
    titulo: formAccount.value.titulo,
    tipo: formAccount.value.tipo,
    valor: formAccount.value.valor,
    vencimento: moment(formAccount.value.vencimento).format('YYYY-MM-DD'),
    descricao: formAccount.value.descricao || '',
    status: formAccount.value.status,
    id_categoria: formAccount.value.category?.id,
    id_forma_pagamento: formAccount.value.formaPagamento?.id ?? null,
  }

  if (isCreditPayment.value) {
    bill.id_cartao_credito = formAccount.value.creditCard?.id;
    bill.data_compra = moment(formAccount.value.dataCompra).format('YYYY-MM-DD');
    bill.parcelas_cartao = formAccount.value.cardInstallments;
    bill.status = 'PE';
  } else if (formAccount.value.contaParcelada === 'S') {
    bill.parcelas = formAccount.value.total_parcelas;
    bill.status = 'PE';
  }

  if (!isCreditPayment.value && formAccount.value.contaFrequente === 'S') {
    bill.frequencia = formAccount.value.frequencia;
    bill.status = 'PE';
  }

  if (!isCreditPayment.value && formAccount.value.status === "PA") {
    bill.id_forma_pagamento = (formAccount.value.formaPagamento || formPayment.value.formaPagamento)?.id;
    bill.id_conta_bancaria = (formAccount.value.bankAccount || formPayment.value.bankAccount)?.id;
    bill.data_pagamento = moment(formAccount.value.dataPagamento || formPayment.value.dataPagamento).format('YYYY-MM-DD');
    bill.valor_pago = formAccount.value.valorPago || formPayment.value.valorPago || formAccount.value.valor;
  }

  api.createBills(bill).then(() => {
    showDialogForm.value = false;
    loadBills();
    loadResumes();
  }).catch((error) => {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: accountError(error),
      life: 3000
    });
  }).finally(() => {
    saving.value = false;
  });
}

const paymentBill = (bill: Bills) => {
  saving.value = true;
  if (!isCreditOnPayment.value && bill.origem_cartao !== 'fatura' && formPayment.value.valorPago > (bill.valor || 0)) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Valor pago não pode ser maior que o valor da conta',
      life: 3000
    });
    saving.value = false;
    return;
  }
  if (!isCreditOnPayment.value && (!Number.isFinite(formPayment.value.valorPago) || formPayment.value.valorPago <= 0)) {
    toast.add({ severity: 'warn', summary: 'Informe um valor pago maior que zero', life: 3000 });
    saving.value = false;
    return;
  }

  const update: PartialBills = { id_forma_pagamento: formPayment.value.formaPagamento.id };
  if (isCreditOnPayment.value) {
    if (!formPayment.value.creditCard || formPayment.value.cardInstallments < 1
      || formPayment.value.cardInstallments > formPayment.value.creditCard.limite_parcelas) {
      toast.add({ severity: 'warn', summary: 'Selecione um cartão e a quantidade de parcelas', life: 3500 });
      saving.value = false;
      return;
    }
    update.status = 'PE';
    update.id_cartao_credito = formPayment.value.creditCard.id;
    update.parcelas_cartao = formPayment.value.cardInstallments;
    update.data_compra = moment(formPayment.value.dataPagamento).format('YYYY-MM-DD');
    update.id_conta_bancaria = undefined;
    update.data_pagamento = undefined;
    update.valor_pago = undefined;
  } else {
    update.status = 'PA';
    update.id_conta_bancaria = formPayment.value.bankAccount.id;
    update.data_pagamento = moment(formPayment.value.dataPagamento).format('YYYY-MM-DD');
    update.valor_pago = formPayment.value.valorPago;
  }

  api.updateBills(bill.id || 0, update).then(() => {
    showDialogPayment.value = false;
    showDialogForm.value = false;
    loadBills();
    loadResumes();
  }).catch((error) => {
    toast.add({ severity: 'error', summary: 'Erro ao atualizar conta', detail: accountError(error), life: 4000 });
  }).finally(() => { saving.value = false; });
}

const updateBill = () => {
  saving.value = true;
  const currentAccount = isEditMode.value ? accountToEdit.value : accountToPay.value;

  if (!currentAccount) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Nenhuma conta selecionada',
      life: 3000
    });
    saving.value = false;
    return;
  }

  const bill: PartialBills = {
    titulo: formAccount.value.titulo,
    tipo: formAccount.value.tipo,
    valor: formAccount.value.valor,
    vencimento: moment(formAccount.value.vencimento).format('YYYY-MM-DD'),
    descricao: formAccount.value.descricao || '',
    id_categoria: formAccount.value.category?.id ?? null,
    id_forma_pagamento: formAccount.value.formaPagamento?.id ?? null,
  };
  if (isCreditPayment.value) {
    bill.id_cartao_credito = formAccount.value.creditCard?.id ?? null;
    bill.data_compra = moment(formAccount.value.dataCompra).format('YYYY-MM-DD');
    bill.parcelas_cartao = formAccount.value.cardInstallments;
  }

  api.updateBills(currentAccount.id || 0, bill).then(() => {
    showDialogPayment.value = false;
    showDialogForm.value = false;
    loadBills();
    loadResumes();
  }).catch((error) => {
    toast.add({ severity: 'error', summary: 'Erro ao atualizar conta', detail: accountError(error), life: 4000 });
  }).finally(() => { saving.value = false; });
}

const deleteBill = ({ success, error }: { success?: () => void, error?: () => void }) => {
  api.updateBills(accountSelected.value?.id || 0, {
    deletado: 'S'
  }).then(() => {
    loadBills();
    loadResumes();

    if (success) {
      success();
    }
  }).catch(() => {
    if (error) {
      error();
    }
  });
}

const removeFromCard = async (bill: Bills) => {
  if (!bill.id || saving.value) return;
  saving.value = true;
  try {
    await api.updateBills(bill.id, { id_forma_pagamento: null });
    toast.add({ severity: 'success', summary: 'Compra retirada do cartão', detail: 'A fatura foi recalculada.', life: 3500 });
    await loadBills();
    loadResumes();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao retirar do cartão', detail: accountError(error), life: 4000 });
  } finally {
    saving.value = false;
  }
};

const close = () => {
  showFilter.value = false;
}

const applyFilter = (filterSelected: FilterBill) => {
  const currentFilters = { ...filter.value }
  ChipsFilter.value = [];

  page.value = 0;
  currentFilters.offset = 0;

  const addChip = (label: string, data: FilterBill, key: string, resetValue: unknown) => {
    ChipsFilter.value.push({
      label,
      data,
      remove: () => {
        ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data[key as keyof FilterBill] !== data[key as keyof FilterBill]);
        applyFilter({
          ...data,
          [key]: resetValue
        });
      }
    });
  };

  const search = filterSelected.search.trim();
  if (search) {
    addChip(`Busca: ${search}`, filterSelected, 'search', '');
    currentFilters.search = search;
  } else {
    delete currentFilters.search;
  }

  const categoryIds = [...new Set(filterSelected.categoryIds)];
  if (categoryIds.length) {
    categoryIds.forEach((categoryId) => {
      const category = categories.value.find((item) => item.id === categoryId);
      ChipsFilter.value.push({
        label: category?.nome || `Categoria ${categoryId}`,
        data: filterSelected,
        remove: () => applyFilter({
          ...filterSelected,
          categoryIds: categoryIds.filter((id) => id !== categoryId),
        }),
      });
    });
    currentFilters.filter = {
      ...currentFilters.filter,
      id_categoria: { IN: categoryIds },
    };
  } else {
    delete currentFilters.filter?.id_categoria;
  }

  if (filterSelected.statusFilter !== 'TO') {
    addChip(filterSelected.statusFilter === 'PA' ? 'Pagos' : 'Pendentes', filterSelected, 'statusFilter', 'TO');
    currentFilters.filter = {
      ...currentFilters.filter,
      status: filterSelected.statusFilter
    };
  } else {
    delete currentFilters.filter?.status;
  }

  if (filterSelected.type !== 'TO') {
    addChip(filterSelected.type === 'R' ? 'Receita' : 'Despesa', filterSelected, 'type', 'TO');
    currentFilters.filter = {
      ...currentFilters.filter,
      tipo: filterSelected.type
    };
  } else {
    delete currentFilters.filter?.tipo;
  }

  if (filterSelected.period.value === 1) {
    addChip(filterSelected.period.label, filterSelected, 'period', { label: 'Mês Atual', value: 1 });
    currentFilters.date_ranger = {
      start_date: moment().startOf('month').format('YYYY-MM-DD'),
      end_date: moment().endOf('month').format('YYYY-MM-DD')
    };
  } else if (filterSelected.period.value === 2) {
    addChip(filterSelected.period.label, filterSelected, 'period', { label: 'Mês Anterior', value: 2 });
    currentFilters.date_ranger = {
      start_date: moment().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
      end_date: moment().add(1, 'month').endOf('month').format('YYYY-MM-DD')
    };
  } else if (filterSelected.period.value === 3) {
    if (filterSelected.radioTypeFilterPeriod === 'mounth') {
      addChip(filterSelected.month.label, filterSelected, 'period', { label: 'Mês Atual', value: 1 });
      currentFilters.date_ranger = {
        start_date: moment().month(filterSelected.month.value - 1).startOf('month').format('YYYY-MM-DD'),
        end_date: moment().month(filterSelected.month.value - 1).endOf('month').format('YYYY-MM-DD')
      };
    } else {
      addChip(`${moment(filterSelected.datePeriod[0]).format('DD/MM/YYYY')} - ${moment(filterSelected.datePeriod[1]).format('DD/MM/YYYY')}`, filterSelected, 'period', { label: 'Mês Atual', value: 1 });
      currentFilters.date_ranger = {
        start_date: moment(filterSelected.datePeriod[0]).format('YYYY-MM-DD'),
        end_date: moment(filterSelected.datePeriod[1]).format('YYYY-MM-DD')
      };
    }
  }

  filter.value = {
    ...currentFilters
  };

  filterOptions.value = filterSelected;
  showFilter.value = false;
  loadBills();
  loadResumes();
}

const changePage = (event: { first: number }) => {
  page.value = event.first;
  filter.value.offset = event.first;
  loadBills();
};

const confirmDelete = (bill: Bills) => {
  accountSelected.value = bill;
  confirm.require({
    message: 'Realmente deseja deletar a conta ?',
    header: 'Atenção',
    icon: 'pi pi-info-circle',
    rejectLabel: 'Cancel',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Deletar',
      severity: 'danger'
    },
    accept: () => {
      deleteBill({
        success: () => {
          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Conta deletada com sucesso',
            life: 3000
          });
        },
        error: () => {
          toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao deletar conta',
            life: 3000
          });
        }
      });
    }
  });
};

function resetFormPayment() {
  formPayment.value = {
    formaPagamento: forms.value[0],
    bankAccount: bankAccounts.value.find((account) => account.principal === 'S') || bankAccounts.value[0],
    dataPagamento: moment().toDate(),
    valorPago: 0,
    cardInstallments: 1,
  };
  accountToPay.value = null;
  accountSelected.value = undefined;
}

function resetFormEdit() {
  isEditMode.value = false;
  accountToEdit.value = null;
  formAccount.value = {
    tipo: "D",
    titulo: '',
    valor: 0,
    status: 'PE',
    pagoOptions: [
      { name: 'Pago', value: 'PA' },
      { name: 'Pendente', value: 'PE' }
    ],
    contaParcelada: "N",
    contaFrequente: "N",
    frequencia: 2,
    total_parcelas: 2,
    valorPago: 0,
    cardInstallments: 1,
    dataCompra: moment().toDate(),
  };
}

watch(bills, () => {
  const data = bills.value as Bills[];
  items.value = data.map((bill) => {
    const items = []

    if (bill.status === 'PE' && bill.origem_cartao !== 'compra') {
      items.push({
        label: 'Dar baixa',
        icon: 'pi pi-arrow-circle-down',
        key: bill.id?.toString(),
        command: () => {
          accountToPay.value = { ...bill };
          formPayment.value.valorPago = bill.valor;
          formPayment.value.formaPagamento = forms.value.find((payment) => payment.id === bill.id_forma_pagamento)
            || forms.value.find((payment) => payment.descricao !== 'CARTÃO DE CRÉDITO') || forms.value[0];
          accountSelected.value = bill;
          showDialogPayment.value = true;
        }
      });
    }

    if (bill.origem_cartao === 'compra') items.push({
      label: 'Retirar do cartão',
      icon: 'pi pi-undo',
      command: () => removeFromCard(bill),
    });

    if (bill.origem_cartao !== 'fatura') items.push(
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
          isEditMode.value = true;
          accountToEdit.value = { ...bill };
          accountSelected.value = bill;
          showDialogForm.value = true;

          formAccount.value.tipo = bill.tipo;
          formAccount.value.titulo = bill.titulo;
          formAccount.value.valor = bill.valor;
          formAccount.value.vencimento = moment(bill.vencimento as string).toDate();
          formAccount.value.descricao = bill.descricao || '';
          formAccount.value.category = categories.value.find((category) => category.id === bill.id_categoria);
          formAccount.value.formaPagamento = forms.value.find((payment) => payment.id === bill.id_forma_pagamento);
          formAccount.value.creditCard = creditCards.value.find((card) => card.id === bill.id_cartao_credito);
          formAccount.value.cardInstallments = bill.parcelas_cartao || 1;
          formAccount.value.dataCompra = moment(bill.data_compra || bill.vencimento as string).toDate();
        }
      },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => {
          confirmDelete(bill);
        }
      }
    );

    return {
      data: bill,
      items: items
    };
  });
});

watch(() => formAccount.value.tipo, () => {
  if (formAccount.value.category && !availableCategories.value.some((category) => category.id === formAccount.value.category?.id)) {
    formAccount.value.category = undefined;
  }
});

watch(showDialogPayment, (newValue) => {
  if (!newValue) {
    resetFormPayment();
  }
});

watch(showDialogForm, (newValue) => {
  if (!newValue) {
    resetFormEdit();
  }
});

loadAllData();

</script>

<template>
  <section class="bills-page app-page">
    <div class="list-header">
      <div>
        <p class="eyebrow">Gestão financeira</p>
        <h2>Contas</h2>
        <span>Cadastre, acompanhe e liquide receitas e despesas.</span>
      </div>
      <div class="page-actions">
        <Button label="Filtrar" icon="pi pi-filter" class="p-button-secondary p-button-sm" @click="showFilter = true" />
        <Button label="Nova conta" icon="pi pi-plus" class="p-button-sm" @click="showDialogForm = true" />
      </div>
    </div>

    <div class="bill-filter-bar orbit-panel">
      <div class="filter-chips">
        <div v-for="item in ChipsFilter" :key="item.label">
          <Chip :label="item.label" removable>
            <template #removeicon="{ keydownCallback }">
              <i class="pi pi-minus-circle" @click="item.remove" @keydown="keydownCallback" />
            </template>
          </Chip>
        </div>
      </div>
    </div>

    <div class="card-resume-container">
      <ValuesTotals :value="resumeBills.saldo" label="Previsão de saldo" icon="pi pi-wallet"
        class="card-resume" :class="resumeBills.saldo >= 0 ? 'card-resume_green' : 'card-resume_danger'" />
      <ValuesTotals :value="resumeBills.totalPagar" label="Total de despesas" icon="pi pi-arrow-up-right"
        class="card-resume card-resume_danger" />
      <ValuesTotals :value="resumeBills.totalReceber" label="Total de receitas" icon="pi pi-arrow-down-left"
        class="card-resume card-resume_green" />
      <ValuesTotals :value="resumeBills.totalFaltaPagar" label="Falta pagar" icon="pi pi-clock"
        class="card-resume card-resume_danger" />
      <ValuesTotals :value="resumeBills.totalFaltaReceber" label="Falta receber" icon="pi pi-hourglass"
        class="card-resume card-resume_green" />
    </div>

    <div v-if="!loadingBills" class="resume">
      <h3>{{ total }} {{ total === 1 ? 'conta encontrada' : 'contas encontradas' }}</h3>
    </div>

    <div v-if="loadingBills" class="bill-loading orbit-panel" aria-live="polite">
      <ProgressSpinner strokeWidth="4" />
      <span>Carregando contas...</span>
    </div>

    <div v-else-if="bills.length" class="responsive-table">
      <DataTable :value="bills" stripedRows tableStyle="min-width: 50rem" sortMode="multiple">
        <Column field="titulo" header="Título">
          <template #body="slotProps">
            {{ slotProps.data.titulo }}
            <Badge :value="slotProps.data.tipo === 'R' ? 'Receita' : 'Despesa'"
              :severity="slotProps.data.tipo === 'R' ? 'success' : 'danger'">
            </Badge>
            <Badge v-if="slotProps.data.origem_cartao" class="ml-2"
              :value="slotProps.data.origem_cartao === 'fatura' ? 'Fatura' : 'Compra no cartão'" severity="info" />
          </template>
        </Column>
        <Column field="valor" header="Valor">
          <template #body="slotProps">
            <span>{{ utils.formatCurrency(slotProps.data.origem_cartao === 'fatura' && slotProps.data.status === 'PA'
              ? slotProps.data.valor_pago ?? slotProps.data.valor : slotProps.data.valor) }}</span>
            <small v-if="slotProps.data.origem_cartao === 'fatura' && slotProps.data.status === 'PA'
              && slotProps.data.valor_pago != null && Number(slotProps.data.valor_pago) !== Number(slotProps.data.valor)"
              class="block">Fatura calculada: {{ utils.formatCurrency(slotProps.data.valor) }}</small>
          </template>
        </Column>
        <Column field="id_categoria" header="Categoria">
          <template #body="slotProps">
            <Tag v-if="categories.find(category => category.id === slotProps.data.id_categoria)"
              :value="categories.find(category => category.id === slotProps.data.id_categoria)?.nome"
              severity="secondary" />
            <Tag v-else value="Sem categoria" severity="secondary" />
          </template>
        </Column>
        <Column field="status" header="Situação">
          <template #body="slotProps">
            <Badge :value="slotProps.data.origem_cartao === 'compra' ? 'Na fatura' : slotProps.data.status === 'PA' ? 'Pago' : 'Pendente'"
              :severity="slotProps.data.origem_cartao === 'compra' ? 'info' : slotProps.data.status === 'PA' ? 'success' : 'danger'">
            </Badge>
          </template>
        </Column>
        <Column field="vencimento" header="Vencimento">
          <template #body="slotProps">
            <span>{{ moment(slotProps.data.vencimento).format('DD/MM/YYYY') }}</span>
          </template>
        </Column>
        <Column field="opcoes" header="Opções">
          <template #body="slotProps">
            <div class="flex justify-content-center gap-2">
              <SplitButton label="Opções" size="small" outlined severity="secondary"
                :model="items?.find(item => item.data.id === slotProps.data.id)?.items || []" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <div v-else class="empty-state orbit-panel">Nenhuma conta encontrada para os filtros selecionados.</div>

    <Paginator v-if="!loadingBills && total > rowsPerPage" :first="page" :rows="rowsPerPage"
      :totalRecords="total" @page="changePage" />
  </section>

  <ModalFilters :showFilter="showFilter" :filter-selected="filterOptions" :categories="categories" @close="close" @apply-filters="applyFilter">
  </ModalFilters>

  <Dialog v-model:visible="showDialogPayment" modal header="Pagar Conta" class="finance-dialog payment-dialog">

    <template #header>
      <h2> Pagar Conta </h2>
    </template>

    <div class="value-pay">
      <h2 :class="accountSelected?.tipo === 'D' ? 'text-danger' : 'text-success'"> {{
        utils.formatCurrency(accountSelected?.valor || 0) }} </h2>
      <span :class="accountSelected?.tipo === 'D' ? 'text-danger' : 'text-success'"> Valor à {{ accountSelected?.tipo
        === 'D' ? 'Pagar' : 'Receber' }} </span>
    </div>

    <div v-if="!isCreditOnPayment" class="mt-3">
      <p>{{ accountSelected?.origem_cartao === 'fatura' ? 'Valor efetivamente pago:' : 'Valor Pago:' }}</p>
      <InputNumber v-model="formPayment.valorPago" date-format="dd/mm/yy" class="w-full mt-2" :minFractionDigits="2"
        :maxFractionDigits="2" fluid />
      <small v-if="accountSelected?.origem_cartao === 'fatura'">Você pode ajustar o valor pago. Se for menor que a fatura, o saldo restante será lançado como conta pendente.</small>
    </div>

    <div class="mt-4">
      <p> Selecione Forma de Pagamento: </p>
      <Select v-model="formPayment.formaPagamento" :options="availablePaymentForms" optionLabel="descricao"
        placeholder="Selecione a forma" class="w-full mt-2" />
    </div>

    <div v-if="isCreditOnPayment" class="mt-3">
      <p>Cartão de crédito:</p>
      <Select v-model="formPayment.creditCard" :options="creditCards" optionLabel="nome"
        placeholder="Selecione o cartão" class="w-full mt-2" />
    </div>

    <div v-if="isCreditOnPayment" class="mt-3">
      <p>Parcelas nas faturas:</p>
      <InputNumber v-model="formPayment.cardInstallments" :min="1"
        :max="formPayment.creditCard?.limite_parcelas || 120" :useGrouping="false" suffix="x" class="w-full mt-2" fluid />
    </div>

    <div v-if="!isCreditOnPayment" class="mt-3">
      <p> Selecione Conta Bancária: </p>
      <Select v-model="formPayment.bankAccount" :options="bankAccounts" optionLabel="descricao"
        placeholder="Selecione a conta bancária" class="w-full mt-2" />
    </div>

    <div class="mt-3">
      <p>{{ isCreditOnPayment ? 'Data da compra:' : 'Data do pagamento:' }}</p>
      <DatePicker v-model="formPayment.dataPagamento" date-format="dd/mm/yy" class="w-full mt-2" />
    </div>

    <template #footer>
      <div class="dialog-footer-actions mt-4">
        <Button label="Cancelar" class="p-button-secondary" @click="showDialogPayment = false" />
        <Button v-if="accountSelected" :label="isCreditOnPayment ? 'Registrar no cartão' : 'Pagar'" class="p-button-primary" :loading="saving" :disabled="saving || !formPayment.formaPagamento?.id || (!isCreditOnPayment && !formPayment.bankAccount?.id)"
          @click="() => paymentBill(accountSelected!)" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="showDialogForm" modal :header="isEditMode ? 'Editar conta' : 'Adicionar conta'"
    class="finance-dialog bill-dialog">
    <form @submit.prevent="isEditMode ? updateBill() : createBill()">
      <Stepper v-if="!isEditMode" value="1" class="w-full" linear>
        <StepList>
          <Step value="1">Dados iniciais</Step>
          <Step v-if="!isCreditPayment" value="2">Parcelas</Step>
          <Step v-if="!isCreditPayment && formAccount.contaParcelada === 'N' && formAccount.contaFrequente === 'N'" value="3">Pagamento
          </Step>
        </StepList>
        <StepPanels>
          <StepPanel v-slot="{ activateCallback }" value="1">
            <div class="form-section form-grid">
              <FloatLabel class="mt-4 w-full full">
                <Select v-model="formAccount.tipo" :options="[
                  { name: 'Despesa', value: 'D' },
                  { name: 'Receita', value: 'R' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Tipo de Conta</label>
              </FloatLabel>

              <FloatLabel variant="on" class="mt-4 w-full full">
                <Select inputId="categoria-conta" v-model="formAccount.category" :options="availableCategories"
                  optionLabel="nome" filter filterPlaceholder="Buscar categoria" showClear class="w-full"
                  emptyFilterMessage="Nenhuma categoria encontrada" />
                <label for="categoria-conta">Categoria (opcional)</label>
              </FloatLabel>

              <FloatLabel class="mt-4 w-full full">
                <InputText id="titulo" v-model="formAccount.titulo" class="w-full" />
                <label for="titulo">Título</label>
              </FloatLabel>

              <FloatLabel class="mt-4 w-full">
                <InputNumber id="valor" v-model="formAccount.valor" class="w-full" :minFractionDigits="2"
                  :maxFractionDigits="2" fluid />
                <label for="valor">Valor</label>
              </FloatLabel>

              <FloatLabel class="mt-4 w-full">
                <DatePicker id="vencimento" v-model="formAccount.vencimento" date-format="dd/mm/yy" class="w-full" />
                <label for="vencimento">Data Vencimento</label>
              </FloatLabel>

              <div class="full">
                <label class="label" for="forma-pagamento-conta">Forma de pagamento (opcional)</label>
                <Select inputId="forma-pagamento-conta" v-model="formAccount.formaPagamento" :options="formAccount.tipo === 'R' ? forms.filter(form => form.descricao !== 'CARTÃO DE CRÉDITO') : forms"
                  optionLabel="descricao" showClear placeholder="Definir antes da baixa" class="w-full" />
              </div>

              <template v-if="isCreditPayment">
                <div>
                  <label class="label" for="cartao-conta">Cartão de crédito *</label>
                  <Select inputId="cartao-conta" v-model="formAccount.creditCard" :options="creditCards"
                    optionLabel="nome" placeholder="Selecione o cartão" class="w-full" />
                </div>
                <div>
                  <label class="label" for="parcelas-cartao-conta">Parcelas na fatura *</label>
                  <InputNumber inputId="parcelas-cartao-conta" v-model="formAccount.cardInstallments" :min="1"
                    :max="formAccount.creditCard?.limite_parcelas || 120" :useGrouping="false" suffix="x" fluid />
                </div>
                <div class="full">
                  <label class="label" for="data-compra-conta">Data da compra *</label>
                  <DatePicker inputId="data-compra-conta" v-model="formAccount.dataCompra" date-format="dd/mm/yy" class="w-full" showIcon fluid />
                  <small>A compra será distribuída nas faturas. O vencimento acima não define a primeira parcela.</small>
                </div>
              </template>

              <FloatLabel class="mt-4 w-full full">
                <Textarea id="descricao" v-model="formAccount.descricao" class="w-full bill-description" rows="5" autoResize />
                <label for="descricao">Descrição (opcional)</label>
              </FloatLabel>

            </div>
            <div class="flex pt-6 justify-end w-full">
              <Button v-if="isCreditPayment" type="submit" label="Criar compra no cartão" icon="pi pi-check" :loading="saving" :disabled="saving" />
              <Button v-else label="Continuar" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('2')" />
            </div>
          </StepPanel>

          <StepPanel v-if="!isCreditPayment" v-slot="{ activateCallback }" value="2">
            <div v-if="formAccount.contaFrequente === 'N'" class="form-section form-grid">
              <FloatLabel class="mt-4 w-full full">
                <Select v-model="formAccount.contaParcelada" :options="[
                  { name: 'Sim', value: 'S' },
                  { name: 'Não', value: 'N' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Conta Parcelada ?</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaParcelada === 'S'" class="form-section form-grid mt-4">
              <FloatLabel class="mt-4 w-full full">
                <InputNumber v-model="formAccount.total_parcelas" :min="2" fluid />
                <label for="titulo">Total de Parcelas</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaParcelada === 'N'" class="form-section form-grid mt-4">
              <FloatLabel class="mt-4 w-full full">
                <Select v-model="formAccount.contaFrequente" :options="[
                  { name: 'Sim', value: 'S' },
                  { name: 'Não', value: 'N' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Conta Frequente ?</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaFrequente === 'S'" class="form-section form-grid mt-4">
              <FloatLabel class="mt-4 w-full full">
                <InputNumber v-model="formAccount.frequencia" :min="2" fluid />
                <label for="titulo">Quantidade de meses</label>
              </FloatLabel>
            </div>

            <div class="flex pt-6 justify-between">
              <Button label="Voltar" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
              <Button v-if="formAccount.contaFrequente === 'N' && formAccount.contaParcelada === 'N'" label="Continuar"
                icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('3')" />

              <Button v-if="formAccount.contaFrequente === 'S' || formAccount.contaParcelada === 'S'" type="submit" :loading="saving" :disabled="saving"
                label="Finalizar" icon="pi pi-check" iconPos="left" />
            </div>
          </StepPanel>

          <StepPanel v-if="!isCreditPayment" v-slot="{ activateCallback }" value="3">
            <div class="form-section form-grid">

              <FloatLabel class="mt-4 w-full full">
                <Select v-model="formAccount.status" :options="formAccount.pagoOptions" optionLabel="name"
                  optionValue="value" placeholder="Selecione status de pagamento" class="w-full" />
                <label for="vencimento">Pagamento</label>
              </FloatLabel>

              <div v-if="formAccount.status == 'PA'" class="full">

                <div class="value-pay">
                  <h2 :class="formAccount.tipo === 'D' ? 'text-danger' : 'text-success'"> {{
                    utils.formatCurrency(formAccount.valor || 0) }} </h2>
                  <span :class="formAccount.tipo === 'D' ? 'text-danger' : 'text-success'"> Valor à {{
                    formAccount.tipo
                      === 'D' ? 'Pagar' : 'Receber' }} </span>
                </div>

                <div class="mt-3">
                  <p> Valor Pago: </p>
                  <InputNumber v-model="formAccount.valorPago" date-format="dd/mm/yy" class="w-full mt-2"
                    :minFractionDigits="2" :maxFractionDigits="2" fluid />
                </div>

                <div class="mt-3">
                  <p> Selecione Conta Bancária: </p>
                  <Select v-model="formAccount.bankAccount" :options="bankAccounts" optionLabel="descricao"
                    placeholder="Selecione a conta bancária" class="w-full mt-2" />
                </div>

                <div class="mt-3">
                  <p> Data do Pagamento: </p>
                  <DatePicker v-model="formAccount.dataPagamento" date-format="dd/mm/yy" class="w-full mt-2" />
                </div>
              </div>

            </div>
            <div class="flex pt-6 justify-between">
              <Button label="Voltar" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('2')" />
              <Button type="submit" label="Finalizar" :loading="saving" :disabled="saving" icon="pi pi-check" iconPos="left" />
            </div>
          </StepPanel>
        </StepPanels>
      </Stepper>

      <div v-if="isEditMode">
        <div class="form-section form-grid">
          <FloatLabel class="mt-4 w-full full">
            <Select v-model="formAccount.tipo" :options="[
              { name: 'Despesa', value: 'D' },
              { name: 'Receita', value: 'R' },
            ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
            <label for="titulo">Tipo de Conta</label>
          </FloatLabel>

          <FloatLabel variant="on" class="mt-4 w-full full">
            <Select inputId="categoria-conta-edicao" v-model="formAccount.category" :options="availableCategories"
              optionLabel="nome" filter filterPlaceholder="Buscar categoria" showClear class="w-full"
              emptyFilterMessage="Nenhuma categoria encontrada" />
            <label for="categoria-conta-edicao">Categoria (opcional)</label>
          </FloatLabel>

          <FloatLabel class="mt-4 w-full full">
            <InputText id="titulo" v-model="formAccount.titulo" class="w-full" />
            <label for="titulo">Título</label>
          </FloatLabel>

          <FloatLabel class="mt-4 w-full">
            <InputNumber id="valor" v-model="formAccount.valor" class="w-full" :minFractionDigits="2"
              :maxFractionDigits="2" fluid />
            <label for="valor">Valor</label>
          </FloatLabel>

          <FloatLabel class="mt-4 w-full">
            <DatePicker id="vencimento" v-model="formAccount.vencimento" date-format="dd/mm/yy" class="w-full" />
            <label for="vencimento">Data Vencimento</label>
          </FloatLabel>

          <div class="full">
            <label class="label" for="forma-pagamento-edicao">Forma de pagamento (opcional)</label>
            <Select inputId="forma-pagamento-edicao" v-model="formAccount.formaPagamento" :options="formAccount.tipo === 'R' ? forms.filter(form => form.descricao !== 'CARTÃO DE CRÉDITO') : forms"
              optionLabel="descricao" showClear placeholder="Definir antes da baixa" class="w-full" />
          </div>

          <template v-if="isCreditPayment">
            <div>
              <label class="label" for="cartao-edicao">Cartão de crédito *</label>
              <Select inputId="cartao-edicao" v-model="formAccount.creditCard" :options="creditCards"
                optionLabel="nome" placeholder="Selecione o cartão" class="w-full" />
            </div>
            <div>
              <label class="label" for="parcelas-cartao-edicao">Parcelas na fatura *</label>
              <InputNumber inputId="parcelas-cartao-edicao" v-model="formAccount.cardInstallments" :min="1"
                :max="formAccount.creditCard?.limite_parcelas || 120" :useGrouping="false" suffix="x" fluid />
            </div>
            <div class="full">
              <label class="label" for="data-compra-edicao">Data da compra *</label>
              <DatePicker inputId="data-compra-edicao" v-model="formAccount.dataCompra" date-format="dd/mm/yy" class="w-full" showIcon fluid />
              <small>Esta data determina a primeira fatura. A previsão de saldo considera o vencimento da fatura; se ela vencer no mesmo mês, o saldo mensal não muda.</small>
            </div>
          </template>

          <FloatLabel class="mt-4 w-full full">
            <Textarea id="descricao" v-model="formAccount.descricao" class="w-full bill-description" rows="5" autoResize />
            <label for="descricao">Descrição (opcional)</label>
          </FloatLabel>

        </div>
        <div class="flex pt-6 justify-end w-full">
          <Button label="Salvar" type="submit" :loading="saving" :disabled="saving" icon="pi pi-check" iconPos="left" />
        </div>
      </div>
    </form>
  </Dialog>
</template>

<style scoped lang="scss">
.bills-page {
  align-content: start;
  gap: 0.75rem;
}

.card-resume-container {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bill-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3.75rem;
  padding: 0.65rem 0.75rem;
}

.resume h3 {
  color: var(--app-text-muted);
  font-size: 0.95rem;
  font-weight: 700;
}

.bill-loading {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.65rem;
  min-height: 10rem;
  color: var(--app-text-muted);
}

.bill-loading :deep(.p-progressspinner) {
  width: 2.5rem;
  height: 2.5rem;
}

.empty-state {
  min-height: 10rem;
}

.bill-description {
  min-height: 8.5rem;
  resize: vertical;
}

@media (max-width: 1024px) {
  .card-resume-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .bill-filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .card-resume-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resume h3 {
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .card-resume-container {
    grid-template-columns: 1fr;
  }
}
</style>
