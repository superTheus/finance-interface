<script setup lang="ts">
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';

import { ref } from 'vue';

const email = ref('');
const pass = ref('');

const showPass = ref(false);

const changePassView = () => {
  showPass.value = !showPass.value;
};

</script>

<template>
  <form class="login-container">
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
          <Button label="Entrar" class="w-full" />
        </div>
      </template>
    </Card>
  </form>
</template>
