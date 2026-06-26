<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from 'primevue';
import { useUserStore } from '@/stores/user';
import { Api } from '@/services/api';
import router from '@/router';
import { useConfigStore } from '@/stores/config';
import OrbitLoader from '@/components/OrbitLoader.vue';
import heroDark from '@/assets/brand/orbitus-hero-dark.png';
import promoRocket from '@/assets/brand/orbitus-promo-rocket.png';

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

const highlights = [
  { icon: 'pi pi-chart-line', label: 'Visão clara' },
  { icon: 'pi pi-bullseye', label: 'Metas em rota' },
  { icon: 'pi pi-shield', label: 'Dados protegidos' },
  { icon: 'pi pi-send', label: 'Planos em ação' },
];

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
    if (formRegister.value.pass !== formRegister.value.confirmPass) {
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
  document.documentElement.classList.toggle('dark-mode', isDarkMode.value);

  config.setConfig({
    ...config.config,
    darkMode: isDarkMode.value,
  });
};
</script>

<template>
  <main class="container home-page">
    <section class="brand-side">
      <img :src="heroDark" alt="Orbitus - suas finanças, seu universo" class="hero-logo" />

      <div class="brand-copy">
        <p class="eyebrow">Centro de comando financeiro</p>
        <h1>Organize hoje para conquistar amanhã.</h1>
        <span>Receitas, despesas, bancos e tarefas orbitando no mesmo painel.</span>
      </div>

      <div class="promo-card">
        <img :src="promoRocket" alt="Mascote Orbitus em um foguete" />
      </div>
    </section>

    <section class="auth-side">
      <div class="auth-card orbit-panel">
        <div class="auth-top">
          <div>
            <p class="eyebrow">{{ isRegisterMode ? 'Nova órbita' : 'Acesso Orbitus' }}</p>
            <h2>{{ isRegisterMode ? 'Criar conta' : 'Entrar no painel' }}</h2>
          </div>
          <Button
            :icon="isDarkMode ? 'pi pi-moon' : 'pi pi-sun'"
            aria-label="Alternar tema"
            class="theme-button"
            severity="secondary"
            text
            rounded
            @click="changeTheme"
            v-tooltip.left="isDarkMode ? 'Tema claro' : 'Tema escuro'"
          />
        </div>

        <form v-if="!isRegisterMode" @submit.prevent="login" class="auth-form">
          <div>
            <label for="email" class="label">Email</label>
            <InputText id="email" type="email" name="email" v-model="email" placeholder="voce@orbitus.app" autocomplete="email" class="w-full" />
          </div>

          <div>
            <label for="pass" class="label">Senha</label>
            <InputGroup>
              <InputText
                id="pass"
                :type="showPass ? 'text' : 'password'"
                name="pass"
                v-model="pass"
                placeholder="Digite sua senha"
                autocomplete="current-password"
              />
              <InputGroupAddon>
                <Button type="button" :icon="showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" text @click="changePassView" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <button type="button" class="switch-mode" @click="isRegisterMode = true">
            Não tem login? Criar conta
          </button>

          <Button type="submit" label="Entrar" icon="pi pi-sign-in" class="w-full" :loading="loading" />
        </form>

        <form v-else class="auth-form" @submit.prevent="create">
          <div>
            <label for="name" class="label">Nome</label>
            <InputText id="name" type="text" name="name" v-model="formRegister.name" placeholder="Seu nome" autocomplete="name" class="w-full" />
          </div>

          <div>
            <label for="register-email" class="label">Email</label>
            <InputText id="register-email" type="email" name="email" v-model="formRegister.email" placeholder="voce@orbitus.app" autocomplete="email" class="w-full" />
          </div>

          <div>
            <label for="register-pass" class="label">Senha</label>
            <InputGroup>
              <InputText
                id="register-pass"
                :type="formRegister.showPass ? 'text' : 'password'"
                name="pass"
                v-model="formRegister.pass"
                placeholder="Digite sua senha"
                autocomplete="new-password"
              />
              <InputGroupAddon>
                <Button type="button" :icon="formRegister.showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" severity="secondary" text @click="formRegister.showPass = !formRegister.showPass" />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div>
            <label for="confirm-pass" class="label">Confirmar senha</label>
            <InputGroup>
              <InputText
                id="confirm-pass"
                :type="formRegister.showConfirmPass ? 'text' : 'password'"
                name="confirm-pass"
                v-model="formRegister.confirmPass"
                placeholder="Repita sua senha"
                autocomplete="new-password"
              />
              <InputGroupAddon>
                <Button
                  type="button"
                  :icon="formRegister.showConfirmPass ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  severity="secondary"
                  text
                  @click="formRegister.showConfirmPass = !formRegister.showConfirmPass"
                />
              </InputGroupAddon>
            </InputGroup>
          </div>

          <button type="button" class="switch-mode" @click="isRegisterMode = false">
            Já tem login? Entrar
          </button>

          <Button type="submit" label="Cadastrar" icon="pi pi-user-plus" class="w-full" :loading="loading" />
        </form>

        <OrbitLoader v-if="loading" compact label="Orbi está preparando seu painel..." />

        <div class="highlight-grid">
          <div v-for="item in highlights" :key="item.label">
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.home-page {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(25rem, 0.85fr);
  gap: clamp(1rem, 2vw, 2rem);
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2rem);
}

.brand-side,
.auth-side {
  position: relative;
  z-index: 1;
}

.brand-side {
  display: grid;
  align-content: center;
  gap: 1rem;
}

.hero-logo {
  width: min(100%, 58rem);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  box-shadow: var(--app-card-shadow);
}

.brand-copy {
  max-width: 44rem;
}

.brand-copy h1 {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(2rem, 4vw, 4.2rem);
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: 0;
}

.brand-copy span {
  display: block;
  max-width: 34rem;
  margin-top: 0.8rem;
  color: var(--app-text-muted);
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  font-weight: 500;
}

.promo-card {
  width: min(100%, 34rem);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--app-card-shadow);
}

.promo-card img {
  display: block;
  width: 100%;
}

.auth-side {
  display: grid;
  align-items: center;
}

.auth-card {
  display: grid;
  gap: 1.25rem;
  width: min(100%, 31rem);
  margin-left: auto;
  padding: clamp(1rem, 2vw, 1.4rem);
}

.auth-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.auth-top h2 {
  margin: 0;
  color: var(--app-text);
  font-size: clamp(1.6rem, 3vw, 2.25rem);
  font-weight: 800;
  letter-spacing: 0;
}

.theme-button {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
}

.auth-form {
  display: grid;
  gap: 1rem;
}

.switch-mode {
  width: fit-content;
  border: 0;
  padding: 0;
  color: var(--orbit-cyan);
  background: transparent;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 800;
  text-align: left;
}

.highlight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.highlight-grid div {
  display: grid;
  place-items: center;
  gap: 0.35rem;
  min-height: 5rem;
  padding: 0.65rem 0.35rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
  text-align: center;
}

.highlight-grid i {
  color: var(--orbit-cyan);
  font-size: 1.25rem;
}

.highlight-grid span {
  color: var(--app-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .home-page {
    grid-template-columns: 1fr;
  }

  .brand-side {
    align-content: start;
  }

  .auth-card {
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .home-page {
    padding: 0.75rem;
  }

  .brand-copy h1 {
    font-size: 2.1rem;
  }

  .promo-card {
    display: none;
  }

  .highlight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
