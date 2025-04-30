<script setup lang="ts">

import { Api } from '@/services/api';
import { Utils } from '@/services/utils';
import { useUserStore } from '@/stores/user';
import type { BankAccounts } from '@/types/types';
import type { MenuItem } from 'primevue/menuitem';
import { ref, watch } from 'vue';

const user = useUserStore();
const utils = new Utils();
const api = new Api();
const bankAccounts = ref<BankAccounts[]>([]);
const isEdit = ref(false);
const isDialogVisible = ref(false);
const accountSelected = ref<BankAccounts | null>(null);
const form = ref({
  descricao: '',
  saldo: 0,
  principal: false
});

function loadBankAccounts() {
  api.findBankAccounts({
    filter: {
      id_user: user.user?.id || 0
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
            console.log('Excluir');
          }
        }
      ]
    };
  });
});

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
  isEdit.value = true;
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
  if (accountSelected.value) {
    api.createBankAccount({
      descricao: form.value.descricao || '',
      saldo: form.value.saldo || 0,
      principal: form.value.principal ? 'S' : 'N'
    }).then(() => {
      loadBankAccounts();
      isDialogVisible.value = false;
    });
  }
};

loadBankAccounts();

</script>

<template>
  <Card>
    <template #title>
      <div class="flex justify-content-between">
        <h3>Contas Bancárias</h3>
        <Button label="Nova Conta" icon="pi pi-plus" class="p-button-sm" @click="setNew" />
      </div>
    </template>

    <template #content>
      <DataTable :value="bankAccounts" class="mt-3" stripedRows tableStyle="min-width: 50rem">
        <Column field="descricao" header="Descrição">
          <template #body="slotProps">
            {{ slotProps.data.descricao }}
            <Badge v-if="slotProps.data.principal === 'S'" value="Conta Principal" severity="info">
            </Badge>
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
    </template>
  </Card>

  <Dialog :header="isEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'" :visible="isDialogVisible" modal
    :closable="false" class="w-full md:w-6 lg:w-4 xl:w-3">
    <div class="p-fluid">
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
        <label for="main"> Conta Principal ? </label>
      </div>

    </div>
    <div class="flex justify-content-end mt-4 gap-2">
      <Button label="Cancelar" severity="danger" class="p-button-text" @click="isDialogVisible = false" />
      <Button label="Salvar" class="p-button-primary" @click="isEdit ? update() : create()" />
    </div>

  </Dialog>
</template>
