<script setup lang="ts">
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { Bills, BillsRequest } from '@/types/types';
import { h, onMounted, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import moment from 'moment';
import { Card } from 'primevue';
import { Utils } from '@/services/utils';
import Badge from 'primevue/badge';
import OverlayBadge from 'primevue/overlaybadge';

const user = useUserStore();
const api = new Api();
const utils = new Utils();
const bills = ref<any[]>([]);

const filter = ref<BillsRequest>({
  filter: {
    id_usuario: user.user?.id || 0
  },
  limit: 10,
  offset: 0,
  date_ranger: {
    start_date: moment().startOf('month').format('YYYY-MM-DD'),
    end_date: moment().endOf('month').format('YYYY-MM-DD')
  }
});

function loadData() {
  api.findBills(filter.value).then((data) => {
    bills.value = data.map((bill) => {
      return {
        ...bill,
        status: bill.status,
        valor: utils.formatCurrency(Number(bill.valor)),
        valor_pago: utils.formatCurrency(Number(bill.valor_pago)),
        vencimento: moment(bill.vencimento).format('DD/MM/YYYY')
      };
    });
  });
}

onMounted(() => {
  loadData();
});

</script>

<template>
  <Card>
    <template #content>
      <DataTable :value="bills" stripedRows tableStyle="min-width: 50rem">
        <Column field="titulo" header="Titulo"></Column>
        <Column field="valor" header="Valor"></Column>
        <Column field="status" header="Situação">
          <template #body="slotProps">
            <Badge :value="slotProps.data.status === 'PA' ? 'Pago' : 'Pendente'"
              :severity="slotProps.data.status === 'PA' ? 'success' : 'danger'">
            </Badge>
          </template>
        </Column>
        <Column field="vencimento" header="Vencimento"></Column>
      </DataTable>
    </template>
  </Card>
</template>
