<script setup lang="ts">
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

import { onMounted, ref } from 'vue';
import { Api } from '@/services/api';
import { useToast } from 'primevue';
import router from '@/router';
import { useUserStore } from '@/stores/user';

const email = ref('');
const pass = ref('');
const toast = useToast();
const showPass = ref(false);
const loading = ref(false);
const userStore = useUserStore();
const api = new Api();

const changePassView = () => {
  showPass.value = !showPass.value;
};

const login = async () => {
  try {
    loading.value = true;

    const data = await api.login(email.value, pass.value);

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Login efetuado com sucesso',
      life: 3000,
    });

    console.log(userStore);

    userStore.setUser(data);
    router.push({ name: 'Dashboard' });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: error.message,
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  console.log(userStore);
});

</script>

<template>
  <form class="login-container" @submit.prevent="login">
    <Card style="max-width: 25rem; width: 100%; overflow: hidden">
      <template #title>Bem vindo 🫡</template>
      <template #subtitle>Faça Login para poder gerenciar sua vida financeira !</template>
      <template #content>

        <div class="flex flex-column gap-1">
          <label for="email" class="label">Email</label>
          <InputText type="email" name="email" v-model="email" placeholder="exemplo@mail.com" />
        </div>

        <div class="flex flex-column gap-1 mt-3">
          <label for="pass" class="label">Senha</label>
          <InputGroup>
            <InputText :type="showPass ? 'text' : 'password'" name="pass" v-model="pass" placeholder="******" />
            <InputGroupAddon>
              <Button :icon="showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" variant="text"
                @click="changePassView" />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div class="mt-4">
          <small> Não tem login ? <a href="#" class="simple-link"> clique aqui </a> </small>
        </div>


      </template>
      <template #footer>
        <div class="flex gap-4 mt-1 justify-content-center align-items-center">
          <Button type="submit" label="Entrar" class="w-full" :loading="loading" />
        </div>
      </template>
    </Card>
  </form>
</template>
