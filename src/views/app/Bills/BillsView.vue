<script setup lang="ts">
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { BankAccounts, Bills, BillsRequest, FilterBill, PaymentsForms, ResumeBills } from '@/types/types';
import { onMounted, ref, watch } from 'vue';
import moment from 'moment';
import { Utils } from '@/services/utils';
import ModalFilters from '@/components/ModalFilters.vue';
import ValuesTotals from '@/components/ValuesTotals.vue';
import type { MenuItem } from 'primevue/menuitem';
import { mounths } from '@/constants/constants';

const user = useUserStore();
const api = new Api();
const utils = new Utils();
const bills = ref<Bills[]>([]);
const page = ref(1);
const total = ref(0);
const showFilter = ref(false);
const showDialogPayment = ref(false);
const forms = ref<PaymentsForms[]>([]);
const bankAccounts = ref<BankAccounts[]>([]);
const dataPagamento = ref<Date>(moment().toDate());
const accountSelected = ref<Bills>();

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0
  },
  limit: 10,
  offset: 0,
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD')
  },
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
  datePeriod: [moment().startOf('month').toDate(), moment().toDate()]
});

const resumeBills = ref<ResumeBills>({
  total_falta_pagar: 0,
  total_falta_receber: 0,
  total_receitas: 0,
  total_despesas: 0
});

const items = ref<{
  data: Bills;
  items: MenuItem[];
}[]>();

const formPayment = ref<{
  formaPagamento: PaymentsForms;
  bankAccount: BankAccounts;
}>({
  formaPagamento: {} as PaymentsForms,
  bankAccount: {} as BankAccounts
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
      total_despesas: 0
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

const updateBill = () => {
  api.updateBills(accountSelected.value?.id || 0, {
    status: 'PA',
    id_forma_pagamento: formPayment.value.formaPagamento.id,
    id_conta_bancaria: formPayment.value.bankAccount.id,
    data_pagamento: moment(dataPagamento.value).format('YYYY-MM-DD')
  }).then(() => {
    showDialogPayment.value = false;
    loadAllData();
  });
}

const close = () => {
  showFilter.value = false;
}

const applyFilter = (filterSelected: FilterBill) => {
  const currentFilters = { ...filter.value }
  ChipsFilter.value = [];

  if (filterSelected.statusFilter === 'TO') {
    delete currentFilters.filter?.status;
  } else {
    ChipsFilter.value.push({
      label: `${filterSelected.statusFilter === 'PA' ? 'PagoS' : 'PendenteS'}`,
      data: filterSelected,
      remove: () => {
        ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.statusFilter !== filterSelected.statusFilter);
        applyFilter({
          ...filterSelected,
          statusFilter: 'TO'
        });
      }
    });

    currentFilters.filter = {
      ...currentFilters.filter,
      status: filterSelected.statusFilter
    }
  }

  if (filterSelected.type === 'TO') {
    delete currentFilters.filter?.tipo;
  } else {
    ChipsFilter.value.push({
      label: `${filterSelected.type === 'R' ? 'Receita' : 'Despesa'}`,
      data: filterSelected,
      remove: () => {
        ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.type !== filterSelected.type);
        applyFilter({
          ...filterSelected,
          type: 'TO'
        });
      }
    });
    currentFilters.filter = {
      ...currentFilters.filter,
      tipo: filterSelected.type
    }
  }

  if (filterSelected.period.value === 1) {
    ChipsFilter.value.push({
      label: `${filterSelected.period.label}`,
      data: filterSelected,
      remove: () => {
        ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.period.value !== filterSelected.period.value);
        applyFilter({
          ...filterSelected,
          period: {
            label: 'Mês Atual',
            value: 1
          }
        });
      }
    });
    currentFilters.date_ranger = {
      start_date: moment().startOf('month').format('YYYY-MM-DD'),
      end_date: moment().endOf('month').format('YYYY-MM-DD')
    }
  } else if (filterSelected.period.value === 2) {
    ChipsFilter.value.push({
      label: `${filterSelected.period.label}`,
      data: filterSelected,
      remove: () => {
        ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.period.value !== filterSelected.period.value);
        applyFilter({
          ...filterSelected,
          period: {
            label: 'Mês Anterior',
            value: 2
          }
        });
      }
    });
    currentFilters.date_ranger = {
      start_date: moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      end_date: moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
    }
  } else if (filterSelected.period.value === 3) {
    if (filterSelected.radioTypeFilterPeriod === 'mounth') {
      ChipsFilter.value.push({
        label: `${filterSelected.month.label}`,
        data: filterSelected,
        remove: () => {
          ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.period.value !== filterSelected.period.value);
          applyFilter({
            ...filterSelected,
            period: {
              label: 'Mês Atual',
              value: 1
            }
          });
        }
      });
      currentFilters.date_ranger = {
        start_date: moment().month(filterSelected.month.value - 1).startOf('month').format('YYYY-MM-DD'),
        end_date: moment().month(filterSelected.month.value - 1).endOf('month').format('YYYY-MM-DD')
      }
    } else {
      ChipsFilter.value.push({
        label: `${moment(filterSelected.datePeriod[0]).format('DD/MM/YYYY')} - ${moment(filterSelected.datePeriod[1]).format('DD/MM/YYYY')}`,
        data: filterSelected,
        remove: () => {
          ChipsFilter.value = ChipsFilter.value.filter((chip) => chip.data.period.value !== filterSelected.period.value);
          applyFilter({
            ...filterSelected,
            period: {
              label: 'Mês Atual',
              value: 1
            }
          });
        }
      });
      currentFilters.date_ranger = {
        start_date: moment(filterSelected.datePeriod[0]).format('YYYY-MM-DD'),
        end_date: moment(filterSelected.datePeriod[1]).format('YYYY-MM-DD')
      }
    }
  }

  filter.value = {
    ...currentFilters
  }

  filterOptions.value = filterSelected;
}

onMounted(() => {
  loadAllData();
});

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

        }
      },
      {
        label: 'Excluir',
        icon: 'pi pi-trash',
        command: () => {

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

</script>

<template>
  <Card class="card-main">
    <template #title>
      <h3>Contas</h3>

      <div class="flex justify-content-between mt-2">
        <Button label="Filtrar" icon="pi pi-filter" class="p-button-secondary" @click="showFilter = true" />
        <Button label="Nova Conta" icon="pi pi-plus" class="p-button-sm" />
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

  <ModalFilters :showFilter="showFilter" :filter-selected="filterOptions" @close="close" @apply-filters="applyFilter" />

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
      <DatePicker v-model="dataPagamento" date-format="dd/mm/yy" class="w-full mt-2" />
    </div>

    <template #footer>
      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-secondary" @click="showDialogPayment = false" />
        <Button label="Pagar" class="p-button-primary" @click="updateBill" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.card-resume-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.value-pay {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
