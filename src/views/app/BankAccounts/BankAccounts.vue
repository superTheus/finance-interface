<script setup lang="ts">

import { Api } from '@/services/api';
import { Utils } from '@/services/utils';
import { useUserStore } from '@/stores/user';
import type { BankAccounts } from '@/types/types';
import type { MenuItem } from 'primevue/menuitem';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const user = useUserStore();
const utils = new Utils();
const api = new Api();
const confirm = useConfirm();
const toast = useToast();
const bankAccounts = ref<BankAccounts[]>([]);
const isEdit = ref(false);
const isDialogVisible = ref(false);
const accountSelected = ref<BankAccounts | null>(null);
const isTransferDialogVisible = ref(false);
const isTransferring = ref(false);
const transferOrigin = ref<BankAccounts | null>(null);
const transferDestinationId = ref<number | null>(null);
const transferAmount = ref<number | null>(null);
const destinationAccounts = computed(() => bankAccounts.value.filter(account => account.id !== transferOrigin.value?.id));
const canTransfer = computed(() =>
  !!transferOrigin.value && !!transferDestinationId.value &&
  transferAmount.value !== null && Number.isFinite(transferAmount.value) &&
  transferAmount.value > 0 &&
  Math.abs(transferAmount.value * 100 - Math.round(transferAmount.value * 100)) < 0.000001 &&
  transferAmount.value <= Number(transferOrigin.value.saldo)
);
const form = ref({
  descricao: '',
  saldo: 0,
  principal: false
});

function loadBankAccounts() {
  api.findBankAccounts({
    filter: {
      id_usuario: user.user?.id || 0
    }
  }).then((data) => {
    bankAccounts.value = data.data;
  });
}

const items = ref<{
  data: BankAccounts;
  items: MenuItem[];
}[]>();

watch(bankAccounts, (newValue) => {
  items.value = newValue.map((item) => {
    return {
      data: item,
      items: [
        {
          label: 'Transferir saldo',
          icon: 'pi pi-arrow-right-arrow-left',
          disabled: newValue.length < 2 || Number(item.saldo) <= 0,
          command: () => openTransfer(item)
        },
        {
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => {
            setUpdatable(item);
          }
        },
        {
          label: 'Excluir',
          icon: 'pi pi-trash',
          command: () => {
            remove(item);
          }
        }
      ]
    };
  });
});

function openTransfer(account: BankAccounts): void {
  transferOrigin.value = account;
  transferDestinationId.value = null;
  transferAmount.value = null;
  isTransferDialogVisible.value = true;
}

async function transferBalance(): Promise<void> {
  if (!canTransfer.value || !transferOrigin.value || !transferDestinationId.value || transferAmount.value === null) return;

  isTransferring.value = true;
  try {
    await api.transferBankBalance({
      id_origem: transferOrigin.value.id,
      id_destino: transferDestinationId.value,
      valor: transferAmount.value,
    });
    isTransferDialogVisible.value = false;
    loadBankAccounts();
    toast.add({ severity: 'success', summary: 'Transferência realizada', life: 3000 });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao transferir saldo',
      detail: error?.response?.data?.message || 'Não foi possível realizar a transferência.',
      life: 4000,
    });
  } finally {
    isTransferring.value = false;
  }
}

function remove(account: BankAccounts): void {
  confirm.require({
    header: 'Excluir conta bancária',
    message: `Deseja excluir “${account.descricao}”?`,
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Cancelar',
    acceptLabel: 'Excluir',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.deleteBankAccount(account.id);
        toast.add({ severity: 'success', summary: 'Conta bancária excluída', life: 3000 });
        loadBankAccounts();
      } catch (error: any) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao excluir conta bancária',
          detail: error?.response?.data?.message || 'Não foi possível excluir a conta bancária.',
          life: 4000,
        });
      }
    },
  });
}

const setUpdatable = (data: BankAccounts) => {
  form.value = {
    descricao: data.descricao,
    saldo: data.saldo,
    principal: data.principal === 'S'
  };
  isEdit.value = true;
  isDialogVisible.value = true;
  accountSelected.value = data;
};

const setNew = () => {
  form.value = {
    descricao: '',
    saldo: 0,
    principal: false
  };
  isEdit.value = false;
  isDialogVisible.value = true;
  accountSelected.value = null;
};

const update = () => {
  if (accountSelected.value) {
    api.updateBankAccount(accountSelected.value.id, {
      descricao: form.value.descricao || '',
      saldo: form.value.saldo || 0,
      principal: form.value.principal ? 'S' : 'N'
    }).then(() => {
      loadBankAccounts();
      isDialogVisible.value = false;
    });
  }
};

const create = () => {
  api.createBankAccount({
    descricao: form.value.descricao || '',
    saldo: form.value.saldo || 0,
    principal: form.value.principal ? 'S' : 'N'
  }).then(() => {
    loadBankAccounts();
    isDialogVisible.value = false;
  });
};

loadBankAccounts();

</script>

<template>
  <section class="bank-page app-page">
      <div class="bank-header">
        <div>
          <p class="eyebrow">Contas do caixa</p>
          <h3>Contas Bancárias</h3>
        </div>
        <Button label="Nova conta" icon="pi pi-plus" class="p-button-sm" @click="setNew" />
      </div>

      <div class="responsive-table">
        <DataTable :value="bankAccounts" class="mt-3" stripedRows tableStyle="min-width: 50rem">
          <Column field="descricao" header="Descrição">
            <template #body="slotProps">
              {{ slotProps.data.descricao }}
              <Badge v-if="slotProps.data.principal === 'S'" value="Conta Principal" severity="info" />
            </template>
          </Column>
          <Column field="valor" header="Valor" class="col-3">
            <template #body="slotProps">
              <span>{{ utils.formatCurrency(slotProps.data.saldo) }}</span>
            </template>
          </Column>
          <Column field="opcoes" header="Opções" class="col-2">
            <template #body="slotProps">
              <div class="flex justify-content-center gap-2">
                <SplitButton label="Opções" size="small" outlined severity="secondary"
                  :model="items?.find(item => item.data.id === slotProps.data.id)?.items || []" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-if="!bankAccounts.length" class="empty-state">Nenhuma conta bancária cadastrada.</div>
  </section>

  <Dialog :header="isEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'" :visible="isDialogVisible" modal
    :closable="false" class="bank-dialog">
    <div class="p-fluid form-section">
      <div class="p-field flex flex-column gap-1">
        <label for="descricao">Descrição</label>
        <InputText id="descricao" v-model="form.descricao" />
      </div>

      <div class="p-field flex flex-column gap-1 mt-3">
        <label for="saldo">Saldo</label>
        <InputNumber id="saldo" mask="" v-model="form.saldo" :minFractionDigits="2" :maxFractionDigits="2" fluid />
      </div>

      <div class="flex items-center gap-2 mt-3">
        <Checkbox v-model="form.principal" inputId="main" name="main" binary />
        <label for="main">Conta Principal?</label>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer-actions mt-4">
        <Button label="Cancelar" severity="secondary" outlined @click="isDialogVisible = false" />
        <Button label="Salvar" class="p-button-primary" @click="isEdit ? update() : create()" />
      </div>
    </template>
  </Dialog>

  <Dialog header="Transferir saldo" :visible="isTransferDialogVisible" modal :closable="!isTransferring" class="bank-dialog"
    @update:visible="isTransferDialogVisible = $event">
    <div class="p-fluid form-section">
      <div class="p-field flex flex-column gap-1">
        <label>Conta de origem</label>
        <div>{{ transferOrigin?.descricao }} · {{ utils.formatCurrency(transferOrigin?.saldo || 0) }} disponíveis</div>
      </div>
      <div class="p-field flex flex-column gap-1 mt-3">
        <label for="transfer-destination">Conta de destino</label>
        <Select id="transfer-destination" v-model="transferDestinationId" :options="destinationAccounts"
          optionLabel="descricao" optionValue="id" placeholder="Selecione a conta" class="w-full" />
      </div>
      <div class="p-field flex flex-column gap-1 mt-3">
        <label for="transfer-amount">Valor</label>
        <InputNumber id="transfer-amount" v-model="transferAmount" mode="currency" currency="BRL" locale="pt-BR"
          :min="0.01" :max="Number(transferOrigin?.saldo || 0)" fluid />
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer-actions mt-4">
        <Button label="Cancelar" severity="secondary" outlined :disabled="isTransferring" @click="isTransferDialogVisible = false" />
        <Button label="Transferir" icon="pi pi-arrow-right-arrow-left" :loading="isTransferring"
          :disabled="!canTransfer || isTransferring" @click="transferBalance" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.bank-page {
  align-content: start;
}

.responsive-table :deep(.p-datatable) {
  min-height: 14rem;
}

.bank-dialog label {
  color: var(--app-text-muted);
  font-weight: 700;
}
</style>
