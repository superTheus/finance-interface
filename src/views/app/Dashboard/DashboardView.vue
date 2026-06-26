<script setup lang="ts">
import ValuesTotals from "@/components/ValuesTotals.vue";
import OrbitLoader from "@/components/OrbitLoader.vue";
import { mounths } from "@/constants/constants";
import { Api } from "@/services/api";
import { useUserStore } from "@/stores/user";
import type { BankAccounts, Bills, BillsRequest, ResumeBills, ResumeBillsYearly } from "@/types/types";
import moment from "moment";
import { computed, ref, watch } from "vue";
import { Utils } from "@/services/utils";
import promoRocket from "@/assets/brand/orbitus-promo-rocket.png";

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
        backgroundColor: '#00D4C8',
        borderColor: '#00D4C8',
        data: dataReceber
      },
      {
        label: 'A pagar',
        backgroundColor: '#FF5470',
        borderColor: '#FF5470',
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


const balanceChartData = computed(() => ({
  labels: monthLabels.value,
  datasets: [
    {
      label: 'Saldo mensal',
      data: monthLabels.value.map((label) => yearlyResumeMap.value.get(normalizeMonthKey(label))?.saldo ?? 0),
      borderColor: '#6C5CE7',
      backgroundColor: 'rgba(108, 92, 231, 0.18)',
      fill: true,
      tension: 0.35
    }
  ]
}));

const monthlyProjectionData = computed(() => ({
  labels: ['Pago/recebido', 'Pendente'],
  datasets: [
    {
      data: [
        resumeBills.value.totalPago + resumeBills.value.totalRecebido,
        resumeBills.value.totalFaltaPagar + resumeBills.value.totalFaltaReceber
      ],
      backgroundColor: ['#00D4C8', '#FFB020'],
      borderWidth: 0
    }
  ]
}));

const compactChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#AEB6D3', boxWidth: 12, boxHeight: 8, padding: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: (context: { label?: string, raw: number }) => `${context.label || 'Valor'}: ${utils.formatCurrency(Number(context.raw || 0))}`
      }
    }
  }
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#AEB6D3', boxWidth: 12, boxHeight: 8, padding: 12, font: { size: 11 } }
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
      stacked: false,
      ticks: { color: '#AEB6D3' },
      grid: { color: 'rgba(174, 182, 211, 0.12)' }
    },
    y: {
      ticks: {
        color: '#AEB6D3',
        callback: (value: string | number) => utils.formatCurrency(Number(value))
      },
      grid: { color: 'rgba(174, 182, 211, 0.12)' }
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
  <section class="dashboard-page app-page">
      <div class="dashboard-hero">
        <div>
          <p class="eyebrow">Visão financeira</p>
          <h2>Dashboard</h2>
          <span>Receitas, despesas, saldo previsto e situação do mês em tempo real.</span>
        </div>
        <Select v-model="currentMounth" :options="monthsSelected.slice(1)" optionLabel="name" option-value="code"
          placeholder="Selecione um mês" class="month-select" />
      </div>

      <div class="orbit-banner orbit-panel">
        <div>
          <p class="eyebrow">Rota do mês</p>
          <h3>Organize hoje para conquistar amanhã.</h3>
          <span>Seu universo financeiro em boas mãos, com dados do período selecionado.</span>
        </div>
        <img :src="promoRocket" alt="Orbi no foguete" />
      </div>

      <div class="card-resume-container">
        <ValuesTotals :value="resumeBills.totalPagar" label="Total de despesas" icon="pi pi-arrow-up-right"
          class="card-resume card-resume_danger" :hint="`${formatQuantity(resumeBills.quantidadeTotalPagar)} lançamentos`" />
        <ValuesTotals :value="resumeBills.totalReceber" label="Total de receitas" icon="pi pi-arrow-down-left"
          class="card-resume card-resume_green" :hint="`${formatQuantity(resumeBills.quantidadeTotalReceber)} lançamentos`" />
        <ValuesTotals :value="resumeBills.saldo" label="Previsão de saldo" icon="pi pi-chart-line" class="card-resume"
          :class="resumeBills.saldo <= 0 ? 'card-resume_danger' : 'card-resume_green'" />
        <ValuesTotals :value="bankAccountsSelected?.saldo" :label="'Saldo - ' + (bankAccountsSelected?.descricao || 'conta principal')"
          icon="pi pi-building-columns" class="card-resume"
          :class="(bankAccountsSelected?.saldo || 0) > 0 ? 'card-resume_green' : 'card-resume_danger'" />
      </div>

      <div class="dashboard-grid">
        <Card class="span-8">
          <template #title><h3>Receita x Despesa por mês</h3></template>
          <template #content>
            <div v-if="!loading" class="card-chart">
              <Chart type="bar" :data="chartData" :options="chartOptions" class="chart" />
            </div>
            <OrbitLoader v-else compact label="Orbi está calculando o gráfico..." />
          </template>
        </Card>
        <Card class="span-4">
          <template #title><h3>Resumo geral</h3></template>
          <template #content>
            <DataTable :value="resumeSummaryRows" stripedRows class="resume-table" tableStyle="min-width: 100%">
              <Column field="label" header="Item" />
              <Column field="value" header="Valor" />
            </DataTable>
          </template>
        </Card>
        <Card class="span-7">
          <template #title><h3>Fluxo de caixa / saldo mensal</h3></template>
          <template #content>
            <div class="mini-chart"><Chart type="line" :data="balanceChartData" :options="chartOptions" /></div>
          </template>
        </Card>
        <Card class="span-5">
          <template #title><h3>Pago x pendente no período</h3></template>
          <template #content>
            <div class="mini-chart"><Chart type="doughnut" :data="monthlyProjectionData" :options="compactChartOptions" /></div>
          </template>
        </Card>
      </div>
  </section>
</template>

<style lang="scss" scoped>
.dashboard-page {
  align-content: start;
}

.month-select {
  min-width: 13rem;
}

.orbit-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 11rem;
  padding: 1rem 1.2rem;
  overflow: hidden;
}

.orbit-banner h3 {
  max-width: 32rem;
  margin: 0;
  color: var(--app-text);
  font-size: clamp(1.35rem, 2.2vw, 2.25rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.orbit-banner span {
  display: block;
  max-width: 30rem;
  margin-top: 0.55rem;
  color: var(--app-text-muted);
  font-weight: 500;
}

.orbit-banner img {
  width: min(44%, 28rem);
  border-radius: 8px;
  object-fit: cover;
}

.card-resume-container {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0.85rem;
}

.span-8 {
  grid-column: span 8;
}

.span-4 {
  grid-column: span 4;
}

.span-7 {
  grid-column: span 7;
}

.span-5 {
  grid-column: span 5;
}

.card-chart {
  position: relative;
  width: 100%;
  height: clamp(18rem, 42vh, 27rem);
}

.mini-chart {
  height: clamp(13rem, 28vh, 17rem);
}

.chart {
  width: 100%;
  height: 100%;
}

.dashboard-grid :deep(.p-card) {
  height: 100%;
}

.dashboard-grid :deep(.p-card-body) {
  height: 100%;
}

@media (max-width: 1024px) {
  .span-8,
  .span-4,
  .span-7,
  .span-5 {
    grid-column: 1 / -1;
  }

  .card-resume-container {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .card-resume-container {
    grid-template-columns: 1fr;
  }

  .month-select {
    width: 100%;
  }

  .orbit-banner {
    display: grid;
  }

  .orbit-banner img {
    width: 100%;
  }

  .card-chart,
  .mini-chart {
    height: 18rem;
  }
}
</style>
