<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue';
import { useUserStore } from '@/stores/user';

import { Api } from '@/services/api';
import router from '@/router';
import { useConfigStore } from '@/stores/config';

import image1 from '@/assets/images/01.png';
import image2 from '@/assets/images/02.svg';
import image3 from '@/assets/images/03.svg';

const config = useConfigStore();
const email = ref('');
const pass = ref('');
const toast = useToast();
const showPass = ref(false);
const loading = ref(false);
const isRegisterMode = ref(false);
const userStore = useUserStore();
const api = new Api();
const isDarkMode = ref(config.config?.darkMode);

const formRegister = ref({
  name: '',
  email: '',
  pass: '',
  confirmPass: '',
  showPass: false,
  showConfirmPass: false,
});

const itemsCarousel = ref([
  {
    image: image1,
    name: 'Tenha gráficos detalhados de suas finanças'
  },
  {
    image: image2,
    name: 'Faça a gestão de suas contas bancárias'
  },
  {
    image: image3,
    name: 'Controle suas despesas e receitas'
  }
])

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

const create = async () => {
  try {
    if(formRegister.value.pass !== formRegister.value.confirmPass) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'As senhas não conferem',
        life: 3000,
      });
      return;
    }

    loading.value = true;

    await api.createUser({
      nome: formRegister.value.name,
      email: formRegister.value.email,
      senha: formRegister.value.pass,
    });

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Cadastro efetuado com sucesso',
      life: 3000,
    });

    isRegisterMode.value = false;
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

const changeTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }

  config.setConfig({
    ...config.config,
    darkMode: isDarkMode.value
  });
};

</script>

<template>
  <div class="container">
    <div class="login-container">
      <div class="left-container">
        <div class="card-container">
          <div class="flex justify-content-between items-center">
            <h1>Bem-vindo 🫡</h1>
            <Button :icon="isDarkMode ? 'pi pi-moon' : 'pi pi-sun'" aria-label="Dark Mode" class="btn"
              severity="secondary" @click="changeTheme" v-tooltip="isDarkMode ? 'Tema claro' : 'Tema escuro'" />
          </div>

          <p class="mt-2">Gerencie suas finanças de forma simples e eficiente. Controle suas despesas, receitas e muito
            mais em um só
            lugar.</p>

          <Carousel :value="itemsCarousel" :numVisible="1" :numScroll="1" verticalViewPortHeight="330px"
            containerClass="flex items-center">
            <template #item="slotProps">
              <div class="carousel-item border border-surface-200 dark:border-surface-700 rounded m-2 p-4">
                <div class="mb-4">
                  <div class="relative mx-auto">
                    <img :src="slotProps.data.image" :alt="slotProps.data.name" class="w-full rounded" />
                  </div>
                </div>
                <div class="mb-4 font-medium text-center text-success">{{ slotProps.data.name }}</div>
              </div>
            </template>
          </Carousel>

          <p class="text-center text-small"> Desenvolvido por <a href="https://github.com/superTheus" target="_blank"
              class="simple-link text-success">
              Matheus Souza </a> </p>
        </div>
      </div>

      <div class="right-container">
        <form v-if="!isRegisterMode" @submit.prevent="login">
          <div class="flex flex-column gap-1 mt-3">
            <h1>Gerencie suas <span class="text-success text-strong"> finanças </span> com facilidade e <span
                class="text-success text-strong"> eficiência! </span> 💰</h1>
            <h3> Faça Login para poder gerenciar sua vida financeira ! </h3>
          </div>

          <div class="flex flex-column gap-1 mt-3">
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
            <small> Não tem login ? <a href="#" class="simple-link text-success text-strong"
                @click="isRegisterMode = true"> clique aqui </a> </small>
          </div>

          <Button type="submit" label="Entrar" icon="pi pi-sign-in" class="mt-4 w-full" :loading="loading" />
        </form>

        <form class="w-full" v-if="isRegisterMode" @submit.prevent="create">
          <div class="flex flex-column gap-1 mt-3">
            <label for="name" class="label">Nome</label>
            <InputText type="text" name="name" v-model="formRegister.name" placeholder="Ex: Matheus Souza" />
          </div>

          <div class="flex flex-column gap-1 mt-3">
            <label for="email" class="label">Email</label>
            <InputText type="email" name="email" v-model="formRegister.email" placeholder="exemplo@mail.com" />
          </div>

          <div class="flex flex-column gap-1 mt-3">
            <label for="pass" class="label">Senha</label>
            <InputGroup>
              <InputText :type="formRegister.showPass ? 'text' : 'password'" name="pass" v-model="formRegister.pass"
                placeholder="******" />
              <InputGroupAddon>
                <Button :icon="formRegister.showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary"
                  variant="text" @click="formRegister.showPass = !formRegister.showPass" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div class="flex flex-column gap-1 mt-3">
            <label for="pass" class="label">Confirmar Senha</label>
            <InputGroup>
              <InputText :type="formRegister.showConfirmPass ? 'text' : 'password'" name="pass"
                v-model="formRegister.confirmPass" placeholder="******" />
              <InputGroupAddon>
                <Button :icon="formRegister.showConfirmPass ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary"
                  variant="text" @click="formRegister.showConfirmPass = !formRegister.showConfirmPass" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div class="mt-4">
            <small> Já tem login ? <a href="#" class="simple-link text-success text-strong"
                @click="isRegisterMode = false"> clique aqui </a> </small>
          </div>

          <Button type="submit" label="Cadastrar" class="mt-4 w-full" :loading="loading" />
        </form>
      </div>
    </div>
  </div>
</template>
