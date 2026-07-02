<script setup lang="ts">
import ValuesTotals from '@/components/ValuesTotals.vue';
import OrbitLoader from '@/components/OrbitLoader.vue';
import { mounths } from '@/constants/constants';
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { BankAccounts, Bills, BillsRequest, ResumeBills, ResumeBillsYearly } from '@/types/types';
import moment from 'moment';
import { computed, ref, watch } from 'vue';
import { Utils } from '@/services/utils';

const user = useUserStore();
const api = new Api();
const utils = new Utils();
const bills = ref<Bills[]>([]);
const loading = ref(true);
const filterResumeReiod = ref({ label: 'Mes atual', value: 1 });
const bankAccountsSelected = ref<BankAccounts>();
const bankAccounts = ref<BankAccounts[]>([]);
const filterType = ref<'d' | 'm'>('m');
const mounthSelected = ref(0);
const currentMounth = ref(mounths.find((m) => m.value === moment().month() + 1)?.value || 0);
const resumeBillsYearly = ref<ResumeBillsYearly[]>([]);
const monthlyProjectionType = ref<'D' | 'R'>('D');

const monthlyProjectionTypeOptions = [
  { label: 'Despesas', value: 'D' },
  { label: 'Receitas', value: 'R' },
];

const emptyResume = (): ResumeBills => ({
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
  saldo: 0,
});

const resumeBills = ref<ResumeBills>(emptyResume());

const normalizeMonthKey = (value: string) => (
  value
    .toLowerCase()
    .replace('marÃ£Â§o', 'marco')
    .replace('marÃ§o', 'marco')
    .replace('marÃƒÂ§o', 'marco')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
);

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

  const dataReceber = labels.map((label) => map.get(normalizeMonthKey(label))?.totalReceber ?? 0);
  const dataPagar = labels.map((label) => {
    const total = map.get(normalizeMonthKey(label))?.totalPagar ?? 0;
    return total === 0 ? 0 : -Math.abs(total);
  });

  return {
    labels,
    datasets: [
      {
        label: 'A receber',
        backgroundColor: '#00D4C8',
        borderColor: '#00D4C8',
        data: dataReceber,
      },
      {
        label: 'A pagar',
        backgroundColor: '#FF5470',
        borderColor: '#FF5470',
        data: dataPagar,
      },
    ],
  };
});

const formatQuantity = (value: number) => value.toLocaleString('pt-BR');

const monthsSelected = ref([
  {
    name: 'Todos os meses',
    code: 0,
  },
  ...mounths.map((m) => ({
    name: m.label,
    code: m.value,
  })),
]);

const balanceTone = computed(() => (resumeBills.value.saldo >= 0 ? 'positive' : 'negative'));

const summarySections = computed(() => ([
  {
    title: 'Despesas',
    tone: 'danger',
    items: [
      {
        label: 'Total',
        value: utils.formatCurrency(resumeBills.value.totalPagar),
        meta: `${formatQuantity(resumeBills.value.quantidadeTotalPagar)} lancamentos`,
      },
      {
        label: 'Pendente',
        value: utils.formatCurrency(resumeBills.value.totalFaltaPagar),
        meta: `${formatQuantity(resumeBills.value.quantidadeFaltaPagar)} de ${formatQuantity(resumeBills.value.quantidadeTotalPagar)}`,
      },
      {
        label: 'Pago',
        value: utils.formatCurrency(resumeBills.value.totalPago),
        meta: `${formatQuantity(resumeBills.value.quantidadePaga)} de ${formatQuantity(resumeBills.value.quantidadeTotalPagar)}`,
      },
    ],
  },
  {
    title: 'Receitas',
    tone: 'success',
    items: [
      {
        label: 'Total',
        value: utils.formatCurrency(resumeBills.value.totalReceber),
        meta: `${formatQuantity(resumeBills.value.quantidadeTotalReceber)} lancamentos`,
      },
      {
        label: 'Pendente',
        value: utils.formatCurrency(resumeBills.value.totalFaltaReceber),
        meta: `${formatQuantity(resumeBills.value.quantidadeFaltaReceber)} de ${formatQuantity(resumeBills.value.quantidadeTotalReceber)}`,
      },
      {
        label: 'Recebido',
        value: utils.formatCurrency(resumeBills.value.totalRecebido),
        meta: `${formatQuantity(resumeBills.value.quantidadeRecebida)} de ${formatQuantity(resumeBills.value.quantidadeTotalReceber)}`,
      },
    ],
  },
  {
    title: 'Resultado',
    tone: balanceTone.value,
    items: [
      {
        label: 'Saldo previsto',
        value: utils.formatCurrency(resumeBills.value.saldo),
        meta: 'Receitas menos despesas',
      },
      {
        label: 'Pago e recebido',
        value: utils.formatCurrency(resumeBills.value.totalPago + resumeBills.value.totalRecebido),
        meta: 'Movimento confirmado',
      },
      {
        label: 'Pendente',
        value: utils.formatCurrency(resumeBills.value.totalFaltaPagar + resumeBills.value.totalFaltaReceber),
        meta: 'A vencer no periodo',
      },
    ],
  },
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
      tension: 0.35,
    },
  ],
}));

const monthlyProjectionData = computed(() => {
  const isRevenue = monthlyProjectionType.value === 'R';

  return {
    labels: [isRevenue ? 'Recebido' : 'Pago', 'Pendente'],
    datasets: [
      {
        data: isRevenue
          ? [resumeBills.value.totalRecebido, resumeBills.value.totalFaltaReceber]
          : [resumeBills.value.totalPago, resumeBills.value.totalFaltaPagar],
        backgroundColor: ['#00D4C8', '#FFB020'],
        borderWidth: 0,
      },
    ],
  };
});

const compactChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#AEB6D3', boxWidth: 12, boxHeight: 8, padding: 12, font: { size: 11 } } },
    tooltip: {
      callbacks: {
        label: (context: { label?: string, raw: number }) => `${context.label || 'Valor'}: ${utils.formatCurrency(Number(context.raw || 0))}`,
      },
    },
  },
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#AEB6D3', boxWidth: 12, boxHeight: 8, padding: 12, font: { size: 11 } },
    },
    tooltip: {
      callbacks: {
        label: (context: { dataset: { label?: string }, raw: number }) => {
          const value = Number(context.raw || 0);
          const label = context.dataset.label ? `${context.dataset.label}: ` : '';
          return `${label}${utils.formatCurrency(Math.abs(value))}`;
        },
      },
    },
  },
  scales: {
    x: {
      stacked: false,
      ticks: { color: '#AEB6D3' },
      grid: { color: 'rgba(174, 182, 211, 0.12)' },
    },
    y: {
      ticks: {
        color: '#AEB6D3',
        callback: (value: string | number) => utils.formatCurrency(Number(value)),
      },
      grid: { color: 'rgba(174, 182, 211, 0.12)' },
    },
  },
}));

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0,
  },
  date_ranger: {
    start_date: moment().startOf('year').format('YYYY-MM-DD'),
    end_date: moment().endOf('year').format('YYYY-MM-DD'),
  },
  order: {
    cols: ['vencimento'],
    direction: 'ASC',
  },
});

const filterResume = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0,
  },
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD'),
  },
});

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
        usuario: user.user?.id || 0,
      }),
      api.resumesYear({
        ano: moment().year(),
        usuario: user.user?.id || 0,
      }),
    ]);

    resumeBills.value = resumos || emptyResume();
    resumeBillsYearly.value = resumoAnual || [];
  } catch (error) {
    console.error('Error loading resumes:', error);
  } finally {
    loading.value = false;
  }
}

function loadBankAccounts() {
  api.findBankAccounts({
    filter: {
      id_usuario: user.user?.id || 0,
    },
  }).then((data) => {
    bankAccounts.value = data.data;
    bankAccountsSelected.value = data.data.find((bank) => bank.principal === 'S');
  });
}

watch(filterResumeReiod, (newVal) => {
  filterResume.value.date_ranger = {
    start_date: moment().startOf('month').add(newVal.value - 1, 'month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').add(newVal.value - 1, 'month').format('YYYY-MM-DD'),
  };

  loadResumes();
});

watch(mounthSelected, (newVal) => {
  if (newVal === 0) {
    filterType.value = 'm';
    filter.value.date_ranger = {
      start_date: moment().startOf('year').format('YYYY-MM-DD'),
      end_date: moment().endOf('year').format('YYYY-MM-DD'),
    };
  } else {
    filterType.value = 'd';
    filter.value.date_ranger = {
      start_date: moment().month(newVal - 1).startOf('month').format('YYYY-MM-DD'),
      end_date: moment().month(newVal - 1).endOf('month').format('YYYY-MM-DD'),
    };
  }

  loadBills();
});

watch(currentMounth, (newVal) => {
  if (newVal === 0) {
    filterResume.value.date_ranger = {
      start_date: moment().startOf('year').format('YYYY-MM-DD'),
      end_date: moment().endOf('year').format('YYYY-MM-DD'),
    };
  } else {
    filterResume.value.date_ranger = {
      start_date: moment().month(newVal - 1).startOf('month').format('YYYY-MM-DD'),
      end_date: moment().month(newVal - 1).endOf('month').format('YYYY-MM-DD'),
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
    <div class="dashboard-toolbar">
      <div>
        <h2>Visao financeira</h2>
      </div>

      <Select
        v-model="currentMounth"
        :options="monthsSelected.slice(1)"
        optionLabel="name"
        option-value="code"
        placeholder="Selecione um mes"
        class="month-select"
      />
    </div>

    <div class="dashboard-summary">
      <Card :class="['balance-card', balanceTone]">
        <template #content>
          <div class="balance-content">
            <div>
              <p>Saldo previsto</p>
              <h3>{{ utils.formatCurrency(resumeBills.saldo) }}</h3>
            </div>
          </div>
        </template>
      </Card>

      <ValuesTotals
        :value="resumeBills.totalReceber"
        label="Receitas"
        icon="pi pi-arrow-down-left"
        class="card-resume card-resume_green"
      />
      <ValuesTotals
        :value="resumeBills.totalPagar"
        label="Despesas"
        icon="pi pi-arrow-up-right"
        class="card-resume card-resume_danger"
      />
      <ValuesTotals
        :value="bankAccountsSelected?.saldo"
        :label="bankAccountsSelected?.descricao || 'Conta principal'"
        icon="pi pi-building-columns"
        class="card-resume"
        :class="(bankAccountsSelected?.saldo || 0) >= 0 ? 'card-resume_green' : 'card-resume_danger'"
      />
    </div>

    <div class="dashboard-grid">
      <Card class="span-12 chart-card">
        <template #title><h3>Receitas x despesas</h3></template>
        <template #content>
          <div v-if="!loading" class="card-chart">
            <Chart type="bar" :data="chartData" :options="chartOptions" class="chart" />
          </div>
          <OrbitLoader v-else compact label="Calculando grafico..." />
        </template>
      </Card>

      <Card class="span-12 summary-card">
        <template #title><h3>Resumo do periodo</h3></template>
        <template #content>
          <div class="summary-sections">
            <section v-for="section in summarySections" :key="section.title" :class="['summary-section', section.tone]">
              <header>
                <span></span>
                <h4>{{ section.title }}</h4>
              </header>

              <div class="summary-items">
                <div v-for="item in section.items" :key="`${section.title}-${item.label}`" class="summary-item">
                  <div>
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </div>
                  <small>{{ item.meta }}</small>
                </div>
              </div>
            </section>
          </div>
        </template>
      </Card>

      <Card class="span-7 chart-card">
        <template #title><h3>Saldo mensal</h3></template>
        <template #content>
          <div class="mini-chart"><Chart type="line" :data="balanceChartData" :options="chartOptions" /></div>
        </template>
      </Card>

      <Card class="span-5 chart-card">
        <template #title>
          <div class="card-title-row">
            <h3>Pago x pendente</h3>
            <SelectButton
              v-model="monthlyProjectionType"
              :options="monthlyProjectionTypeOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
              class="chart-type-switch"
            />
          </div>
        </template>
        <template #content>
          <div class="mini-chart"><Chart :key="monthlyProjectionType" type="doughnut" :data="monthlyProjectionData" :options="compactChartOptions" /></div>
        </template>
      </Card>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.dashboard-page {
  align-content: start;
  gap: 0.75rem;
}

.dashboard-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0 0.1rem 0.2rem;
}

.dashboard-toolbar h2 {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(1rem, 1.5vw, 1.3rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0;
}

.month-select {
  min-width: 11rem;
}

.dashboard-summary {
  display: grid;
  grid-template-columns: minmax(14rem, 1.2fr) repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.balance-card {
  min-height: 5.6rem;
}

.balance-card :deep(.p-card-content) {
  height: 100%;
}

.balance-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.balance-content p,
.balance-content h3 {
  margin: 0;
}

.balance-content p {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
}

.balance-content h3 {
  margin-top: 0.15rem;
  color: currentColor;
  font-size: clamp(1.05rem, 1.65vw, 1.35rem);
  font-weight: 800;
  line-height: 1.08;
}

.balance-card.positive {
  color: var(--orbit-cyan);
}

.balance-card.negative {
  color: var(--orbit-pink);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 0.65rem;
}

.span-8 {
  grid-column: span 8;
}

.span-12 {
  grid-column: 1 / -1;
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
  height: clamp(15rem, 35vh, 22rem);
}

.mini-chart {
  height: clamp(11rem, 24vh, 15rem);
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

.dashboard-grid :deep(.p-card-title h3) {
  margin: 0;
  font-size: clamp(0.92rem, 1.25vw, 1.05rem);
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chart-type-switch {
  flex: 0 0 auto;
}

.chart-type-switch :deep(.p-togglebutton) {
  padding: 0.35rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.summary-sections {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.summary-section {
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: color-mix(in srgb, var(--app-surface-soft), transparent 28%);
}

.summary-section header {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.7rem;
}

.summary-section header span {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--orbit-purple);
  flex: 0 0 auto;
}

.summary-section h4 {
  margin: 0;
  color: var(--app-text);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
}

.summary-section.success header span {
  background: var(--orbit-cyan);
}

.summary-section.danger header span,
.summary-section.negative header span {
  background: var(--orbit-pink);
}

.summary-section.positive header span {
  background: var(--orbit-cyan);
}

.summary-items {
  display: grid;
  gap: 0.55rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  min-width: 0;
  padding-top: 0.55rem;
  border-top: 1px solid var(--app-border);
}

.summary-item:first-child {
  padding-top: 0;
  border-top: 0;
}

.summary-item div {
  min-width: 0;
}

.summary-item span,
.summary-item small {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.summary-item strong {
  display: block;
  margin-top: 0.1rem;
  color: var(--app-text);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.15;
}

.summary-item small {
  align-self: end;
  max-width: 9rem;
  text-align: right;
  line-height: 1.2;
}

@media (max-width: 1024px) {
  .span-8,
  .span-4,
  .span-7,
  .span-5 {
    grid-column: 1 / -1;
  }

  .dashboard-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-sections {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .dashboard-summary {
    grid-template-columns: 1fr;
  }

  .month-select {
    width: 100%;
  }

  .card-chart,
  .mini-chart {
    height: 18rem;
  }
}
</style>
