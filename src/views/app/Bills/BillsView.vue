<script setup lang="ts">
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { BankAccounts, Bills, BillsRequest, FilterBill, PaymentsForms, ResumeBills } from '@/types/types';
import { ref, watch } from 'vue';
import moment from 'moment';
import { Utils } from '@/services/utils';
import ModalFilters from '@/components/ModalFilters.vue';
import ValuesTotals from '@/components/ValuesTotals.vue';
import type { MenuItem } from 'primevue/menuitem';
import { mounths } from '@/constants/constants';
import { useConfirm, useToast } from 'primevue';

const user = useUserStore();
const confirm = useConfirm();
const toast = useToast();
const api = new Api();
const utils = new Utils();
const bills = ref<Bills[]>([]);
const page = ref(1);
const total = ref(0);
const showFilter = ref(false);
const showDialogPayment = ref(false);
const showDialogForm = ref(false);
const isEditMode = ref(false);
const forms = ref<PaymentsForms[]>([]);
const bankAccounts = ref<BankAccounts[]>([]);
const accountSelected = ref<Bills>();

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
  status: 'PA' | 'PN';
  data_pagamento?: Date;
  valor_pago?: number;
  contaParcelada?: "S" | "N";
  contaFrequente?: "S" | "N";
  total_parcelas?: number;
  frequencia?: number;
  formaPagamento?: PaymentsForms;
  bankAccount?: BankAccounts;
  valorPago: number;
  dataPagamento?: Date;
}>({
  tipo: "D",
  titulo: '',
  valor: 0,
  status: 'PN',
  pagoOptions: [
    { name: 'Pago', value: 'PA' },
    { name: 'Pendente', value: 'PN' }
  ],
  contaParcelada: "N",
  contaFrequente: "N",
  frequencia: 2,
  total_parcelas: 2,
  valorPago: 0,
});

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0,
    deletado: 'N'
  },
  limit: 5,
  offset: 0,
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD')
  },
  order: {
    cols: ["vencimento", "id"],
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
  datePeriod: [moment().startOf('month').toDate(), moment().toDate()]
});

const resumeBills = ref<ResumeBills>({
  total_falta_pagar: 0,
  total_falta_receber: 0,
  total_receitas: 0,
  total_despesas: 0,
  total_recebido: 0,
  total_pago: 0,
  saldo: 0
});

const items = ref<{
  data: Bills;
  items: MenuItem[];
}[]>();

const formPayment = ref<{
  formaPagamento: PaymentsForms;
  bankAccount: BankAccounts;
  valorPago: number;
  dataPagamento: Date;
}>({
  formaPagamento: {} as PaymentsForms,
  bankAccount: {} as BankAccounts,
  dataPagamento: moment().toDate(),
  valorPago: 0
});

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

function loadBills() {
  api.findBills(filter.value).then((data) => {
    total.value = data.total;
    bills.value = data.data;
  });
}

function loadResumes() {
  api.resumes({
    date_ranger: filter.value.date_ranger || {
      start_date: moment().startOf('month').format('YYYY-MM-DD'),
      end_date: moment().endOf('month').format('YYYY-MM-DD')
    },
    filter: filter.value.filter || {
      id_usuario: user.user?.id || 0
    }
  }).then((data) => {
    resumeBills.value = data;
  }).catch(() => {
    resumeBills.value = {
      total_falta_pagar: 0,
      total_falta_receber: 0,
      total_receitas: 0,
      total_despesas: 0,
      total_recebido: 0,
      total_pago: 0,
      saldo: 0
    };
  });
}

function loadAllData() {
  loadBills();
  loadResumes();
  Promise.all([
    api.payments(),
    api.findBankAccounts({
      filter: {
        id_user: user.user?.id || 0
      }
    })
  ]).then(([payments, accounts]) => {
    forms.value = payments;
    bankAccounts.value = accounts.data;

    formPayment.value.formaPagamento = payments[0];
    formPayment.value.bankAccount = accounts.data.find((account) => account.principal === 'S') || accounts.data[0];
  });
}

const createBill = () => {
  const bill: Bills = {
    id_usuario: user.user?.id || 0,
    titulo: formAccount.value.titulo,
    tipo: formAccount.value.tipo,
    valor: formAccount.value.valor,
    vencimento: moment(formAccount.value.vencimento).format('YYYY-MM-DD'),
    descricao: formAccount.value.descricao || '',
    status: formAccount.value.status,
    data_pagamento: moment(formAccount.value.data_pagamento).format('YYYY-MM-DD'),
  }

  if (formAccount.value.contaParcelada === 'S') {
    bill.total_parcelas = formAccount.value.total_parcelas;
    bill.status = 'PN';
  }

  if (formAccount.value.contaFrequente === 'S') {
    bill.frequencia = formAccount.value.frequencia;
    bill.status = 'PN';
  }

  if (formAccount.value.status === "PA") {
    bill.id_forma_pagamento = formPayment.value.formaPagamento.id;
    bill.id_conta_bancaria = formPayment.value.bankAccount.id;
    bill.data_pagamento = moment(formPayment.value.dataPagamento).format('YYYY-MM-DD');
    bill.valor_pago = formPayment.value.valorPago;
  }

  api.createBills(bill).then(() => {
    showDialogForm.value = false;
    loadBills();
    loadResumes();
  }).catch((error) => {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: error.response.data.message,
      life: 3000
    });
  });
}

const updateBill = () => {
  if (formPayment.value.valorPago > (accountSelected.value?.valor || 0)) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Valor pago não pode ser maior que o valor da conta',
      life: 3000
    });
    return;
  }

  const bill = { ...accountSelected.value }

  if (isEditMode) {
    bill.titulo = formAccount.value.titulo,
      bill.tipo = formAccount.value.tipo,
      bill.valor = formAccount.value.valor,
      bill.vencimento = moment(formAccount.value.vencimento).format('YYYY-MM-DD'),
      bill.descricao = formAccount.value.descricao || ''
  } else {
    bill.status = 'PA',
      bill.id_forma_pagamento = formPayment.value.formaPagamento.id,
      bill.id_conta_bancaria = formPayment.value.bankAccount.id,
      bill.data_pagamento = moment(formPayment.value.dataPagamento).format('YYYY-MM-DD'),
      bill.valor_pago = formPayment.value.valorPago
  }

  api.updateBills(accountSelected.value?.id || 0, bill).then(() => {
    showDialogPayment.value = false;
    showDialogForm.value = false;
    loadBills();
    loadResumes();
  });
}

const deleteBill = ({ success, error }: { success?: Function, error?: Function }) => {
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

const close = () => {
  showFilter.value = false;
}

const applyFilter = (filterSelected: FilterBill) => {
  const currentFilters = { ...filter.value }
  ChipsFilter.value = [];

  const addChip = (label: string, data: FilterBill, key: string, resetValue: any) => {
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

  if (filterSelected.statusFilter !== 'TO') {
    addChip(filterSelected.statusFilter === 'PA' ? 'PagoS' : 'PendenteS', filterSelected, 'statusFilter', 'TO');
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
}

const confirmDelete = (bill: Bills) => {
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

watch(bills, () => {
  const data = bills.value as Bills[];
  items.value = data.map((bill) => {
    const items = []

    if (bill.status === 'PN') {
      items.push({
        label: 'Dar baixa',
        icon: 'pi pi-arrow-circle-down',
        key: bill.id?.toString(),
        command: () => {
          formPayment.value.valorPago = bill.valor;
          accountSelected.value = bill;
          showDialogPayment.value = true;
        }
      });
    }

    items.push(
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => {
          isEditMode.value = true;
          accountSelected.value = bill;
          showDialogForm.value = true;

          formAccount.value.tipo = bill.tipo;
          formAccount.value.titulo = bill.titulo;
          formAccount.value.valor = bill.valor;
          formAccount.value.vencimento = moment(bill.vencimento).toDate();
          formAccount.value.descricao = bill.descricao || '';
        }
      },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => {
          accountSelected.value = bill;
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

watch(page, () => {
  filter.value.offset = page.value;
  loadBills();
});

watch(filter, () => {
  loadResumes();
  loadBills();
});

loadAllData();

</script>

<template>
  <Card>
    <template #title>
      <p>Contas</p>

      <div class="flex justify-content-between mt-2">
        <Button label="Filtrar" icon="pi pi-filter" class="p-button-secondary" @click="showFilter = true" />
        <Button label="Nova Conta" icon="pi pi-plus" class="p-button-sm" @click="showDialogForm = true" />
      </div>
    </template>

    <template #content>
      <div class="mt-3 flex gap-2">
        <div v-for="item in ChipsFilter" :key="item.label">
          <Chip :label="item.label" removable>
            <template #removeicon="{ removeCallback, keydownCallback }">
              <i class="pi pi-minus-circle" @click="item.remove" @keydown="keydownCallback" />
            </template>
          </Chip>
        </div>
      </div>

      <div class="card-resume-container mt-3">
        <ValuesTotals :value="resumeBills.total_despesas" label="Total de despesas" icon="pi pi-file"
          class="card-resume card-resume_danger" />
        <ValuesTotals :value="resumeBills.total_receitas" label="Total de receitas" icon="pi pi-file"
          class="card-resume card-resume_green" />
        <ValuesTotals :value="resumeBills.total_falta_pagar" label="Total falta pagar" icon="pi pi-file"
          class="card-resume card-resume_danger" />
        <ValuesTotals :value="resumeBills.total_falta_receber" label="Total falta receber" icon="pi pi-file"
          class="card-resume card-resume_green" />
      </div>

      <div v-if="total" class="resume mt-3">
        <h3> {{ total }} Contas encontradas </h3>
      </div>

      <DataTable :value="bills" class="mt-3" stripedRows tableStyle="min-width: 50rem">
        <Column field="titulo" header="Titulo">
          <template #body="slotProps">
            {{ slotProps.data.titulo }}
            <Badge :value="slotProps.data.tipo === 'R' ? 'Receita' : 'Despesa'"
              :severity="slotProps.data.tipo === 'R' ? 'success' : 'danger'">
            </Badge>
          </template>
        </Column>
        <Column field="valor" header="Valor">
          <template #body="slotProps">
            <span>{{ utils.formatCurrency(slotProps.data.valor) }}</span>
          </template>
        </Column>
        <Column field="status" header="Situação">
          <template #body="slotProps">
            <Badge :value="slotProps.data.status === 'PA' ? 'Pago' : 'Pendente'"
              :severity="slotProps.data.status === 'PA' ? 'success' : 'danger'">
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

      <Paginator v-model:first="page" :rows="filter.limit" :totalRecords="total"></Paginator>
    </template>
  </Card>

  <ModalFilters :showFilter="showFilter" :filter-selected="filterOptions" @close="close" @apply-filters="applyFilter">
  </ModalFilters>

  <Dialog v-model:visible="showDialogPayment" modal header="Pagar Conta" :style="{ width: 'auto', minWidth: '30rem' }">

    <template #header>
      <h2> Pagar Conta </h2>
    </template>

    <div class="value-pay">
      <h2 :class="accountSelected?.tipo === 'D' ? 'text-danger' : 'text-success'"> {{
        utils.formatCurrency(accountSelected?.valor || 0) }} </h2>
      <span :class="accountSelected?.tipo === 'D' ? 'text-danger' : 'text-success'"> Valor à {{ accountSelected?.tipo
        === 'D' ? 'Pagar' : 'Receber' }} </span>
    </div>

    <div class="mt-3">
      <p> Valor Pago: </p>
      <InputNumber v-model="formPayment.valorPago" date-format="dd/mm/yy" class="w-full mt-2" :minFractionDigits="2"
        :maxFractionDigits="2" fluid />
    </div>

    <div class="mt-4">
      <p> Selecione Forma de Pagamento: </p>
      <Select v-model="formPayment.formaPagamento" :options="forms" optionLabel="descricao"
        placeholder="Selecione a forma" class="w-full mt-2" />
    </div>

    <div class="mt-3">
      <p> Selecione Conta Bancária: </p>
      <Select v-model="formPayment.bankAccount" :options="bankAccounts" optionLabel="descricao"
        placeholder="Selecione a conta bancária" class="w-full mt-2" />
    </div>

    <div class="mt-3">
      <p> Data do Pagamento: </p>
      <DatePicker v-model="formPayment.dataPagamento" date-format="dd/mm/yy" class="w-full mt-2" />
    </div>

    <template #footer>
      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-secondary" @click="showDialogPayment = false" />
        <Button label="Pagar" class="p-button-primary" @click="updateBill" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="showDialogForm" modal :header="isEditMode ? 'Editar conta' : 'Adicionar conta'"
    :style="{ width: 'auto', minWidth: '60rem' }">
    <form @submit.prevent="isEditMode ? updateBill() : createBill()">
      <Stepper v-if="!isEditMode" value="1" class="w-full" linear>
        <StepList>
          <Step value="1">Dados Inicias</Step>
          <Step value="2">Parcelas</Step>
          <Step v-if="formAccount.contaParcelada === 'N' && formAccount.contaFrequente === 'N'" value="3">Pagamento
          </Step>
        </StepList>
        <StepPanels>
          <StepPanel v-slot="{ activateCallback }" value="1">
            <div class="flex flex-col h-48 w-50 m-auto gap-2">
              <FloatLabel class="mt-4 w-full">
                <Select v-model="formAccount.tipo" :options="[
                  { name: 'Despesa', value: 'D' },
                  { name: 'Receita', value: 'R' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Tipo de Conta</label>
              </FloatLabel>

              <FloatLabel class="mt-4 w-full">
                <InputText id="titulo" v-model="formAccount.titulo" class="w-full" />
                <label for="titulo">Titulo</label>
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

              <FloatLabel class="mt-4 w-full">
                <Textarea id="descricao" v-model="formAccount.descricao" class="w-full" rows="5" />
                <label for="descricao">Descrição (Opcional)</label>
              </FloatLabel>

            </div>
            <div class="flex pt-6 justify-end w-full">
              <Button label="Continuar" icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('2')" />
            </div>
          </StepPanel>

          <StepPanel v-slot="{ activateCallback }" value="2">
            <div v-if="formAccount.contaFrequente === 'N'" class="flex flex-col h-48 w-50 m-auto gap-2">
              <FloatLabel class="mt-4 w-full">
                <Select v-model="formAccount.contaParcelada" :options="[
                  { name: 'Sim', value: 'S' },
                  { name: 'Não', value: 'N' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Conta Parcelada ?</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaParcelada === 'S'" class="flex flex-col h-48 w-50 m-auto gap-2 mt-4">
              <FloatLabel class="mt-4 w-full">
                <InputNumber v-model="formAccount.total_parcelas" :min="2" fluid />
                <label for="titulo">Total de Parcelas</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaParcelada === 'N'" class="flex flex-col h-48 w-50 m-auto gap-2 mt-4">
              <FloatLabel class="mt-4 w-full">
                <Select v-model="formAccount.contaFrequente" :options="[
                  { name: 'Sim', value: 'S' },
                  { name: 'Não', value: 'N' },
                ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
                <label for="titulo">Conta Frequente ?</label>
              </FloatLabel>
            </div>

            <div v-if="formAccount.contaFrequente === 'S'" class="flex flex-col h-48 w-50 m-auto gap-2 mt-4">
              <FloatLabel class="mt-4 w-full">
                <InputNumber v-model="formAccount.frequencia" :min="2" fluid />
                <label for="titulo">Quantidade de meses</label>
              </FloatLabel>
            </div>

            <div class="flex pt-6 justify-between">
              <Button label="Voltar" severity="secondary" icon="pi pi-arrow-left" @click="activateCallback('1')" />
              <Button v-if="formAccount.contaFrequente === 'N' && formAccount.contaParcelada === 'N'" label="Continuar"
                icon="pi pi-arrow-right" iconPos="right" @click="activateCallback('3')" />

              <Button v-if="formAccount.contaFrequente === 'S' || formAccount.contaParcelada === 'S'" type="submit"
                label="Finalizar" icon="pi pi-check" iconPos="left" />
            </div>
          </StepPanel>

          <StepPanel v-slot="{ activateCallback }" value="3">
            <div class="flex flex-col h-48 w-50 m-auto gap-2">

              <FloatLabel class="mt-4 w-full">
                <Select v-model="formAccount.status" :options="formAccount.pagoOptions" optionLabel="name"
                  optionValue="value" placeholder="Selecione status de pagamento" class="w-full" />
                <label for="vencimento">Pagamento</label>
              </FloatLabel>

              <div v-if="formAccount.status == 'PA'">

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

                <div class="mt-4">
                  <p> Selecione Forma de Pagamento: </p>
                  <Select v-model="formAccount.formaPagamento" :options="forms" optionLabel="descricao"
                    placeholder="Selecione a forma" class="w-full mt-2" />
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
              <Button type="submit" label="Finalizar" icon="pi pi-check" iconPos="left" />
            </div>
          </StepPanel>
        </StepPanels>
      </Stepper>

      <div v-if="isEditMode">
        <div class="flex flex-col h-48 w-50 m-auto gap-2">
          <FloatLabel class="mt-4 w-full">
            <Select v-model="formAccount.tipo" :options="[
              { name: 'Despesa', value: 'D' },
              { name: 'Receita', value: 'R' },
            ]" optionLabel="name" optionValue="value" placeholder="Selecione" class="w-full" />
            <label for="titulo">Tipo de Conta</label>
          </FloatLabel>

          <FloatLabel class="mt-4 w-full">
            <InputText id="titulo" v-model="formAccount.titulo" class="w-full" />
            <label for="titulo">Titulo</label>
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

          <FloatLabel class="mt-4 w-full">
            <Textarea id="descricao" v-model="formAccount.descricao" class="w-full" rows="5" />
            <label for="descricao">Descrição (Opcional)</label>
          </FloatLabel>

        </div>
        <div class="flex pt-6 justify-end w-full">
          <Button label="Salvar" type="submit" icon="pi pi-check" iconPos="left" />
        </div>
      </div>
    </form>
  </Dialog>
</template>

<style scoped lang="scss">
.card-resume-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  overflow-x: auto;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

}

.value-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
