<script setup lang="ts">
import ValuesTotals from "@/components/ValuesTotals.vue";
import { mounths } from "@/constants/constants";
import { Api } from "@/services/api";
import { useUserStore } from "@/stores/user";
import type { BankAccounts, Bills, BillsRequest, ResumeBills, ResumeBillsYearly } from "@/types/types";
import moment from "moment";
import { computed, ref, watch } from "vue";
import { Utils } from "@/services/utils";

const user = useUserStore();
const api = new Api();
const utils = new Utils();
const bills = ref<Bills[]>([]);
const loading = ref(true);
const filterResumeReiod = ref({ label: 'Mês Atual', value: 1 });
const bankAccountsSelected = ref<BankAccounts>();
const bankAccounts = ref<BankAccounts[]>([]);

const filterType = ref<'d' | 'm'>('m');

const mounthSelected = ref(0);

const currentMounth = ref(mounths.find(m => m.value === moment().month() + 1)?.value || 0);

const resumeBillsYearly = ref<ResumeBillsYearly[]>([]);

const resumeBills = ref<ResumeBills>({
  totalPagar: 0,
  totalFaltaPagar: 0,
  totalPago: 0,
  totalReceber: 0,
  totalFaltaReceber: 0,
  totalRecebido: 0,
  quantidadeFaltaPagar: 0,
  quantidadePaga: 0,
  quantidadeTotalPagar: 0,
  quantidadeFaltaReceber: 0,
  quantidadeRecebida: 0,
  quantidadeTotalReceber: 0,
  saldo: 0
});

const normalizeMonthKey = (value: string) => {
  const lowerValue = value.toLowerCase();
  const fixedValue = lowerValue
    .replace('marã§o', 'marco')
    .replace('março', 'marco')
    .replace('marÃ§o', 'marco');

  return fixedValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
};

const monthLabels = computed(() => {
  if (mounths.length >= 12) {
    return mounths.slice(0, 12).map((m) => m.label);
  }

  return utils.getMonthsUntilNow();
});

const yearlyResumeMap = computed(() => {
  const map = new Map<string, ResumeBillsYearly>();

  resumeBillsYearly.value.forEach((item) => {
    map.set(normalizeMonthKey(item.mes), item);
  });

  return map;
});

const chartData = computed(() => {
  const labels = monthLabels.value;
  const map = yearlyResumeMap.value;

  const dataReceber = labels.map((label) => {
    const key = normalizeMonthKey(label);
    return map.get(key)?.totalReceber ?? 0;
  });

  const dataPagar = labels.map((label) => {
    const key = normalizeMonthKey(label);
    const total = map.get(key)?.totalPagar ?? 0;
    return total === 0 ? 0 : -Math.abs(total);
  });

  return {
    labels,
    datasets: [
      {
        label: 'A receber',
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
        data: dataReceber
      },
      {
        label: 'A pagar',
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        data: dataPagar
      }
    ]
  };
});

const formatQuantity = (value: number) => value.toLocaleString('pt-BR');

const resumeSummaryRows = computed(() => ([
  { label: 'Total pagar', value: `${utils.formatCurrency(resumeBills.value.totalPagar) } (${formatQuantity(resumeBills.value.quantidadeTotalPagar)})` },
  { label: 'Falta pagar', value: `${utils.formatCurrency(resumeBills.value.totalFaltaPagar) } (${formatQuantity(resumeBills.value.quantidadeFaltaPagar)}/${formatQuantity(resumeBills.value.quantidadeTotalPagar)})` },
  { label: 'Total pago', value: `${utils.formatCurrency(resumeBills.value.totalPago)} (${formatQuantity(resumeBills.value.quantidadePaga)}/${formatQuantity(resumeBills.value.quantidadeTotalPagar)})` },
  { label: 'Total receber', value: `${utils.formatCurrency(resumeBills.value.totalReceber)} (${formatQuantity(resumeBills.value.quantidadeTotalReceber)})` },
  { label: 'Falta receber', value: `${utils.formatCurrency(resumeBills.value.totalFaltaReceber) } (${formatQuantity(resumeBills.value.quantidadeFaltaReceber)}/${formatQuantity(resumeBills.value.quantidadeTotalReceber)})` },
  { label: 'Total recebido', value: `${utils.formatCurrency(resumeBills.value.totalRecebido)} (${formatQuantity(resumeBills.value.quantidadeRecebida)}/${formatQuantity(resumeBills.value.quantidadeTotalReceber)})`},
  { label: 'Saldo Previsão', value: utils.formatCurrency(resumeBills.value.saldo) }
]));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label?: string }, raw: number }) => {
          const value = Number(context.raw || 0);
          const label = context.dataset.label ? `${context.dataset.label}: ` : '';
          return `${label}${utils.formatCurrency(Math.abs(value))}`;
        }
      }
    }
  },
  scales: {
    x: {
      stacked: false
    },
    y: {
      ticks: {
        callback: (value: string | number) => utils.formatCurrency(Number(value))
      }
    }
  }
}));

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0
  },
  date_ranger: {
    start_date: moment().startOf('year').format('YYYY-MM-DD'),
    end_date: moment().endOf('year').format('YYYY-MM-DD')
  },
  order: {
    cols: ["vencimento"],
    direction: "ASC"
  }
});

const filterResume = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0
  },
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD')
  }
});

const monthsSelected = ref([
  {
    name: 'Todos os Meses',
    code: 0
  },
  ...mounths.map((m, index) => {
    return {
      name: m.label,
      code: m.value
    }
  })
]);

function loadBills() {
  api.findBills(filter.value).then((data) => {
    bills.value = data.data;
    loading.value = false;
  });
}

async function loadResumes() {
  try {
    loading.value = true;
    const [resumos, resumoAnual] = await Promise.all([
      api.resumes({
        fim: filterResume.value.date_ranger?.end_date || moment().endOf('month').format('YYYY-MM-DD'),
        inicio: filterResume.value.date_ranger?.start_date || moment().startOf('month').format('YYYY-MM-DD'),
        usuario: user.user?.id || 0
      }),
      api.resumesYear({
        ano: moment().year(),
        usuario: user.user?.id || 0
      })
    ]);

    if (resumos) {
      resumeBills.value = resumos;
    } else {
      resumeBills.value = {
        totalPagar: 0,
        totalFaltaPagar: 0,
        totalPago: 0,
        totalReceber: 0,
        totalFaltaReceber: 0,
        totalRecebido: 0,
        quantidadeFaltaPagar: 0,
        quantidadePaga: 0,
        quantidadeTotalPagar: 0,
        quantidadeFaltaReceber: 0,
        quantidadeRecebida: 0,
        quantidadeTotalReceber: 0,
        saldo: 0
      };
    }

    if (resumoAnual) {
      resumeBillsYearly.value = resumoAnual;
    } else {
      resumeBillsYearly.value = [];
    }
  } catch (error) {
    console.error('Error loading resumes:', error);
  } finally {
    loading.value = false;
  }
}

function loadBankAccounts() {
  api.findBankAccounts({
    filter: {
      id_usuario: user.user?.id || 0
    }
  }).then((data) => {
    bankAccounts.value = data.data;
    bankAccountsSelected.value = data.data.find(bank => bank.principal === 'S');
  });
}

watch(filterResumeReiod, (newVal) => {
  filterResume.value.date_ranger = {
    start_date: moment().startOf('month').add(newVal.value - 1, 'month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').add(newVal.value - 1, 'month').format('YYYY-MM-DD')
  };

  loadResumes();
});

watch(mounthSelected, (newVal) => {
  if (newVal === 0) {
    filterType.value = 'm';
    filter.value.date_ranger = {
      start_date: moment().startOf('year').format('YYYY-MM-DD'),
      end_date: moment().endOf('year').format('YYYY-MM-DD')
    };
  } else {
    filterType.value = 'd';
    filter.value.date_ranger = {
      start_date: moment().month(newVal - 1).startOf('month').format('YYYY-MM-DD'),
      end_date: moment().month(newVal - 1).endOf('month').format('YYYY-MM-DD')
    };
  }

  loadBills();
});

watch(currentMounth, (newVal) => {
  if (newVal === 0) {
    filterResume.value.date_ranger = {
      start_date: moment().startOf('year').format('YYYY-MM-DD'),
      end_date: moment().endOf('year').format('YYYY-MM-DD')
    };
  } else {
    filterResume.value.date_ranger = {
      start_date: moment().month(newVal - 1).startOf('month').format('YYYY-MM-DD'),
      end_date: moment().month(newVal - 1).endOf('month').format('YYYY-MM-DD')
    };
  }

  loadResumes();
});

loadBills();
loadResumes();
loadBankAccounts();

</script>

<template>
  <Card>
    <template #title>
      <h3>Dashboards</h3>
    </template>
    <template #content>
      <div class="flex justify-content-between align-items-center">
        <h3> Resumos </h3>
        <Select v-model="currentMounth" :options="monthsSelected.slice(1)" optionLabel="name" option-value="code"
          placeholder="Selecione um mês" />
      </div>

      <div class="card-resume-container my-3">
        <ValuesTotals :value="resumeBills.totalPagar" label="Total de despesas" icon="pi pi-file"
          class="card-resume card-resume_danger" />
        <ValuesTotals :value="resumeBills.totalReceber" label="Total de receitas" icon="pi pi-file"
          class="card-resume card-resume_green" />
        <ValuesTotals :value="resumeBills.saldo" label="Previsão de Saldo" icon="pi pi-file" class="card-resume"
          :class="resumeBills.saldo <= 0 ? 'card-resume_danger' : 'card-resume_green'" />
        <ValuesTotals :value="bankAccountsSelected?.saldo" :label="'Saldo - ' + bankAccountsSelected?.descricao"
          icon="pi pi-file" class="card-resume"
          :class="(bankAccountsSelected?.saldo || 0) > 0 ? 'card-resume_green' : 'card-resume_danger'" />
      </div>

      <div class="dashboard-grid grid mt-4">
        <div class="col-12 md:col-9">
          <Card class="dashboard-chart-card">
            <template #title>
              <h3>Contas - Ano</h3>
            </template>
            <template #content>
              <div v-if="!loading" class="card-chart">
                <Chart type="bar" :data="chartData" :options="chartOptions" class="chart" />
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-3">
          <Card class="dashboard-summary-card">
            <template #title>
              <h3>Resumo geral</h3>
            </template>
            <template #content>
              <DataTable :value="resumeSummaryRows" stripedRows class="resume-table" tableStyle="min-width: 100%">
                <Column field="label" header="Item" />
                <Column field="value" header="Valor" />
              </DataTable>
            </template>
          </Card>
        </div>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.card-resume-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  overflow-x: auto;
}

.card-chart {
  width: 100%;
  height: 50vh;
  position: relative;
}

.chart {
  width: 100%;
  height: 100%;
}

.dashboard-grid :deep(.p-card) {
  height: 100%;
}
</style>
