<script setup lang="ts">
import ValuesTotals from "@/components/ValuesTotals.vue";
import { mounths } from "@/constants/constants";
import { Api } from "@/services/api";
import { useUserStore } from "@/stores/user";
import type { BankAccounts, Bills, BillsRequest, ResumeBills } from "@/types/types";
import moment from "moment";
import { ref, watch } from "vue";
import { Utils } from "@/services/utils";

const utils = new Utils();
const user = useUserStore();
const api = new Api();
const bills = ref<Bills[]>([]);
const loading = ref(true);
const chartData = ref();
const chartOptions = ref();
const filterResumeReiod = ref({ label: 'Mês Atual', value: 1 });
const bankAccountsSelected = ref<BankAccounts>();
const bankAccounts = ref<BankAccounts[]>([]);

const filterType = ref<'d' | 'm'>('m');

const mounthSelected = ref(0);

const currentMounth = ref(mounths.find(m => m.value === moment().month() + 1)?.value || 0);

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

const filtersOptions = ref({
  options: [
    { label: 'Mês Atual', value: 1 },
    { label: 'Próximo Mês', value: 2 }
  ],
})

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

function loadResumes() {
  api.resumes({
    fim: filterResume.value.date_ranger?.end_date || moment().endOf('month').format('YYYY-MM-DD'),
    inicio: filterResume.value.date_ranger?.start_date || moment().startOf('month').format('YYYY-MM-DD'),
    usuario: user.user?.id || 0
  }).then((data) => {
    resumeBills.value = data;
  }).catch(() => {
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
  });
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

// const setChartData = (bills: Bills[]) => {
//   let payments = bills.filter(bill => bill.tipo === 'D');
//   let receipts = bills.filter(bill => bill.tipo === 'R');

//   var labels: string[] = [];

//   filterType.value === 'm' ? labels.push(...mounths.map(m => m.label)) : labels.push(...utils.getDaysInMonth(mounthSelected.value, moment().year()).map(d => d.label));

//   let values = filterType.value === 'm' ? mounths.map(mounth => {
//     let billsPayments = payments.filter(bill => moment(bill.vencimento).month() === mounth.value - 1);
//     let billsReceipts = receipts.filter(bill => moment(bill.vencimento).month() === mounth.value - 1);

//     return {
//       payments: billsPayments.reduce((acc, bill) => acc + Number(bill.valor), 0) * -1,
//       receipts: billsReceipts.reduce((acc, bill) => acc + Number(bill.valor), 0)
//     }
//   }) : utils.getDaysInMonth(mounthSelected.value, moment().year()).map(day => {
//     let billsPayments = payments.filter(bill => moment(bill.vencimento).date() === day.value);
//     let billsReceipts = receipts.filter(bill => moment(bill.vencimento).date() === day.value);

//     return {
//       payments: billsPayments.reduce((acc, bill) => acc + Number(bill.valor), 0) * -1,
//       receipts: billsReceipts.reduce((acc, bill) => acc + Number(bill.valor), 0)
//     }
//   });

//   if (filterType.value === 'd') {
//     let indexToRemove: number[] = [];

//     labels.forEach((label, index) => {
//       if (values[index].payments === 0 && values[index].receipts === 0) {
//         indexToRemove.push(index);
//       }
//     });

//     const newLabels = labels.filter((label, index) => !indexToRemove.includes(index));
//     const newValues = values.filter((value, index) => !indexToRemove.includes(index));
//     labels = newLabels;
//     values = newValues;
//   }

//   return {
//     labels: labels,
//     datasets: [
//       {
//         label: 'Despesas',
//         data: values.map(v => v.payments),
//         backgroundColor: ['rgba(255, 99, 132, 0.8)'],
//         borderColor: ['rgb(255, 99, 132)'],
//         borderWidth: 1
//       },
//       {
//         label: 'Receitas',
//         data: values.map(v => v.receipts),
//         backgroundColor: ['rgba(75, 192, 192, 0.8)'],
//         borderColor: ['rgb(75, 192, 192)'],
//         borderWidth: 1
//       }
//     ]
//   };
// };

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColorSecondary
        },
        grid: {
          color: surfaceBorder
        }
      }
    }
  };
}

// watch(bills, (newVal: Bills[]) => {
//   chartData.value = setChartData(newVal);
//   chartOptions.value = setChartOptions();
// });

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
        <Select v-model="currentMounth" :options="monthsSelected.slice(1)" optionLabel="name" option-value="code" placeholder="Selecione um mês" />
      </div>

      <!-- <div class="card-resume-container my-3">
        <ValuesTotals :value="resumeBills.total_despesas" label="Total de despesas" icon="pi pi-file"
          class="card-resume card-resume_danger" />
        <ValuesTotals :value="resumeBills.total_receitas" label="Total de receitas" icon="pi pi-file"
          class="card-resume card-resume_green" />
        <ValuesTotals :value="resumeBills.saldo" label="Previsão de Saldo" icon="pi pi-file" class="card-resume"
          :class="resumeBills.saldo <= 0 ? 'card-resume_danger' : 'card-resume_green'" />
        <ValuesTotals :value="bankAccountsSelected?.saldo" :label="'Saldo - ' + bankAccountsSelected?.descricao"
          icon="pi pi-file" class="card-resume"
          :class="(bankAccountsSelected?.saldo || 0) > 0 ? 'card-resume_green' : 'card-resume_danger'" />
      </div>

      <div class="chart-container mt-4">
        <div class="flex justify-content-between align-items-center">
          <h3> Contas - Mês </h3>
          <Select v-model="mounthSelected" :options="monthsSelected" optionLabel="name" option-value="code"
            placeholder="Selecione um mês" />
        </div>
        <div v-if="!loading" class="card-chart">
          <Chart class="chart" type="bar" :data="chartData" :options="chartOptions" />
        </div>
      </div> -->
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
</style>
