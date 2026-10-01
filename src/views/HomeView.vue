<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '@/stores/user';
import { Api } from '@/services/api';
import { requestGoogleAuthCode } from '@/services/googleAuth';
import router from '@/router';
import logoDark from '@/assets/images/logos/logo_dark.png';

const toast = useToast();
const userStore = useUserStore();
const api = new Api();

const email = ref('');
const pass = ref('');
const showPass = ref(false);
const showConfirmPass = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
const route = router.currentRoute;
const registering = computed(() => route.value.name === 'registrar');
const name = ref('');
const confirmPass = ref('');
const registerLoading = ref(false);

watch(registering, () => {
  pass.value = '';
  confirmPass.value = '';
  showPass.value = false;
  showConfirmPass.value = false;
});

onMounted(() => {
  document.documentElement.classList.add('dark-mode');
});

const changePassView = () => {
  showPass.value = !showPass.value;
};

const loginErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
    }

    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }
  }

  return 'Não foi possível entrar agora. Tente novamente em instantes.';
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

    userStore.setUser({ ...data, senha: pass.value });
    router.push({ name: 'Dashboard' });
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Não foi possível entrar',
      detail: loginErrorMessage(error),
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};

const register = async () => {
  if (pass.value !== confirmPass.value) {
    toast.add({ severity: 'error', summary: 'Confira a senha', detail: 'As senhas não coincidem.', life: 4500 });
    return;
  }

  try {
    registerLoading.value = true;
    const data = await api.register({ nome: name.value.trim(), email: email.value.trim(), senha: pass.value });
    userStore.setUser(data);
    toast.add({ severity: 'success', summary: 'Conta criada', detail: 'Bem-vindo ao Orbitus!', life: 3000 });
    router.push({ name: 'Dashboard' });
  } catch (error: unknown) {
    const message = isAxiosError(error)
      ? error.response?.data?.message || 'Não foi possível criar a conta.'
      : 'Não foi possível criar a conta.';
    toast.add({ severity: 'error', summary: 'Cadastro não concluído', detail: message, life: 5000 });
  } finally {
    registerLoading.value = false;
  }
};

const loginWithGoogle = async () => {
  try {
    googleLoading.value = true;
    const { code, codeVerifier, redirectUri } = await requestGoogleAuthCode();
    const data = await api.loginWithGoogle({
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });
    userStore.setUser(data);
    toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Login efetuado com Google', life: 3000 });
    router.push({ name: 'Dashboard' });
  } catch (error: unknown) {
    const detail = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Não foi possível entrar com Google.';
    toast.add({
      severity: 'error',
      summary: 'Erro no login com Google',
      detail,
      life: 4000,
    });
  } finally {
    googleLoading.value = false;
  }
};
</script>

<template>
  <main class="home-page">
    <div class="space-scene" aria-hidden="true">
      <span class="star-layer star-layer-back"></span>
      <span class="star-layer star-layer-mid"></span>
      <span class="star-layer star-layer-front"></span>
      <span class="galaxy galaxy-one"></span>
      <span class="galaxy galaxy-two"></span>
      <span class="shooting-star"></span>
    </div>

    <section class="login-shell" aria-label="Acesso Orbitus">
      <div class="brand-side">
        <img :src="logoDark" alt="Orbitus - suas financas, seu universo" class="brand-logo" />

        <div class="welcome-copy">
          <p class="welcome-kicker">{{ registering ? 'Comece sua jornada' : 'Bem-vindo de volta' }}</p>
          <h1>{{ registering ? 'Crie sua conta e organize suas finanças.' : 'Entre para continuar sua jornada financeira.' }}</h1>
        </div>
      </div>

      <div class="auth-side">
        <form v-if="registering" class="login-form" @submit.prevent="register">
          <div>
            <label for="register-name" class="label">Nome</label>
            <InputText id="register-name" v-model="name" name="name" autocomplete="name" required maxlength="150"
              placeholder="Seu nome" class="auth-input" />
          </div>
          <div>
            <label for="register-email" class="label">Email</label>
            <InputText id="register-email" v-model="email" name="email" type="email" autocomplete="email" required maxlength="190"
              placeholder="voce@email.com" class="auth-input" />
          </div>
          <div>
            <label for="register-pass" class="label">Senha</label>
            <div class="password-control">
              <InputText id="register-pass" v-model="pass" name="password" :type="showPass ? 'text' : 'password'"
                autocomplete="new-password" required minlength="8" maxlength="72"
                placeholder="Pelo menos 8 caracteres" class="password-input" />
              <button type="button" class="password-toggle" :aria-label="showPass ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPass" @click="changePassView">
                <i :class="showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div>
            <label for="register-confirm" class="label">Confirme a senha</label>
            <div class="password-control">
              <InputText id="register-confirm" v-model="confirmPass" name="confirm-password"
                :type="showConfirmPass ? 'text' : 'password'" autocomplete="new-password" required minlength="8" maxlength="72"
                placeholder="Digite a senha novamente" class="password-input" />
              <button type="button" class="password-toggle"
                :aria-label="showConfirmPass ? 'Ocultar confirmação da senha' : 'Mostrar confirmação da senha'"
                :aria-pressed="showConfirmPass" @click="showConfirmPass = !showConfirmPass">
                <i :class="showConfirmPass ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <Button type="submit" label="Criar conta" icon="pi pi-user-plus" class="w-full submit-button"
            :loading="registerLoading" />
          <p class="auth-switch">Já tem conta? <RouterLink to="/">Entrar</RouterLink></p>
        </form>
        <form v-else class="login-form" @submit.prevent="login">
          <div>
            <label for="email" class="label">Email</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              name="email"
              placeholder="voce@email.com"
              autocomplete="email"
              class="auth-input"
            />
          </div>

          <div>
            <label for="pass" class="label">Senha</label>
            <div class="password-control">
              <InputText
                id="pass"
                v-model="pass"
                :type="showPass ? 'text' : 'password'"
                name="pass"
                placeholder="Sua senha"
                autocomplete="current-password"
                class="password-input"
              />
              <button type="button" class="password-toggle" :aria-label="showPass ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPass" @click="changePassView">
                <i :class="showPass ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <Button type="submit" label="Entrar" icon="pi pi-sign-in" class="w-full submit-button" :loading="loading" />
          <div class="google-login">
            <span>ou</span>
            <Button type="button" label="Entrar com Google" icon="pi pi-google" severity="secondary"
              class="w-full" :loading="googleLoading" :disabled="loading" @click="loginWithGoogle" />
          </div>
          <p class="auth-switch">Ainda não tem conta? <RouterLink to="/registrar">Registra-se aqui</RouterLink></p>
        </form>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.google-login { display: grid; gap: .75rem; text-align: center; }
.google-login span { color: var(--app-text-muted); }
.auth-switch { margin: 0; text-align: center; color: var(--app-text-muted); }
.auth-switch a { color: var(--orbit-cyan); font-weight: 700; text-decoration: underline; }
.home-page {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: clamp(1rem, 3vw, 2rem);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 120%, rgba(108, 92, 231, 0.24), transparent 42%),
    radial-gradient(ellipse at 12% 18%, rgba(0, 212, 200, 0.12), transparent 34%),
    linear-gradient(145deg, #030713 0%, #090d1e 45%, #0d1024 100%);
}

.space-scene,
.star-layer,
.galaxy,
.shooting-star {
  position: absolute;
  pointer-events: none;
}

.space-scene {
  inset: 0;
  overflow: hidden;
}

.star-layer {
  inset: -20%;
  opacity: 0.72;
  transform: translate3d(0, 0, 0);
  will-change: transform, opacity;
}

.star-layer-back {
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.36) 0 1px, transparent 1.4px),
    radial-gradient(circle, rgba(124, 103, 255, 0.28) 0 1px, transparent 1.6px);
  background-position:
    0 0,
    4rem 7rem;
  background-size:
    8rem 8rem,
    13rem 13rem;
  animation: starDriftBack 48s linear infinite;
}

.star-layer-mid {
  opacity: 0.58;
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.7) 0 1px, transparent 1.7px),
    radial-gradient(circle, rgba(0, 212, 200, 0.44) 0 1px, transparent 1.5px);
  background-position:
    2rem 5rem,
    10rem 3rem;
  background-size:
    11rem 11rem,
    17rem 17rem;
  animation: starDriftMid 34s linear infinite;
}

.star-layer-front {
  opacity: 0.4;
  background-image:
    radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 1.2px, transparent 1.8px),
    radial-gradient(circle, rgba(255, 176, 32, 0.55) 0 1px, transparent 1.8px);
  background-position:
    7rem 9rem,
    1rem 2rem;
  background-size:
    18rem 18rem,
    24rem 24rem;
  animation:
    starDriftFront 26s linear infinite,
    starPulse 4.6s ease-in-out infinite alternate;
}

.galaxy {
  width: clamp(18rem, 36vw, 34rem);
  aspect-ratio: 1.8 / 1;
  filter: blur(18px);
  opacity: 0.42;
  transform: rotate(-18deg);
  mix-blend-mode: screen;
}

.galaxy-one {
  left: -7rem;
  top: 8%;
  background:
    conic-gradient(from 20deg, transparent, rgba(108, 92, 231, 0.56), rgba(0, 212, 200, 0.28), transparent 62%),
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.12), transparent 62%);
  border-radius: 50%;
  animation: galaxyFloatOne 20s ease-in-out infinite alternate;
}

.galaxy-two {
  right: -9rem;
  bottom: 7%;
  width: clamp(20rem, 42vw, 42rem);
  background:
    conic-gradient(from 140deg, transparent, rgba(255, 84, 112, 0.34), rgba(255, 176, 32, 0.2), rgba(124, 103, 255, 0.4), transparent 72%),
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1), transparent 68%);
  border-radius: 50%;
  animation: galaxyFloatTwo 24s ease-in-out infinite alternate;
}

.shooting-star {
  top: 18%;
  left: 68%;
  width: 9rem;
  height: 1px;
  opacity: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.92), transparent);
  transform: rotate(-28deg);
  animation: shootingStar 8s ease-in-out infinite;
}

.login-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 27rem);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  width: min(100%, 72rem);
  min-height: min(37rem, calc(100vh - 4rem));
}

.brand-side {
  display: grid;
  justify-items: start;
  gap: clamp(1rem, 2vw, 1.35rem);
  padding-right: clamp(0rem, 3vw, 2rem);
}

.brand-logo {
  display: block;
  width: min(100%, 32rem);
  aspect-ratio: 3 / 2;
  object-fit: contain;
  filter: drop-shadow(0 24px 50px rgba(0, 0, 0, 0.36));
}

.welcome-copy {
  display: grid;
  gap: 0.55rem;
  max-width: 28rem;
}

.welcome-kicker {
  margin: 0;
  color: var(--orbit-cyan);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.welcome-copy h1 {
  max-width: 26rem;
  margin: 0;
  color: #ffffff;
  font-size: clamp(1.6rem, 2.4vw, 2.35rem);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: 0;
  text-shadow: 0 18px 45px rgba(0, 0, 0, 0.42);
}

.auth-side {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.login-form {
  display: grid;
  gap: 1.15rem;
  width: 100%;
  padding: clamp(1.1rem, 2.5vw, 1.6rem);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--app-radius);
  background:
    linear-gradient(145deg, rgba(108, 92, 231, 0.16), transparent 48%),
    rgba(18, 23, 39, 0.78);
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.login-form .label {
  color: rgba(247, 247, 251, 0.72);
}

.submit-button {
  min-height: 3.2rem;
  margin-top: 0.25rem;
}

:deep(.auth-input) {
  width: 100%;
  height: 3.2rem;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  background: rgba(9, 13, 30, 0.52) !important;
}

:deep(.auth-input::placeholder),
:deep(.password-input::placeholder) {
  color: rgba(247, 247, 251, 0.48) !important;
}

.password-control {
  position: relative;
  width: 100%;
  height: 3.2rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--app-radius);
  color: #ffffff;
  background: rgba(9, 13, 30, 0.52);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.password-control:focus-within {
  border-color: var(--orbit-cyan);
  box-shadow: 0 0 0 0.18rem rgba(0, 212, 200, 0.14);
}

:deep(.password-input) {
  width: 100%;
  height: 100%;
  padding-right: 3.2rem !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: #ffffff !important;
}

.password-toggle {
  display: grid;
  place-items: center;
  position: absolute;
  top: 0;
  right: 0;
  width: 3.2rem;
  height: 100%;
  border: 0;
  color: rgba(247, 247, 251, 0.64);
  background: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.password-toggle:hover {
  color: #ffffff;
}

.password-toggle:focus-visible { outline: 2px solid var(--orbit-cyan); outline-offset: -4px; border-radius: var(--app-radius); }

.password-toggle i {
  font-size: 1.05rem;
}

@keyframes starDriftBack {
  to {
    transform: translate3d(5rem, 4rem, 0);
  }
}

@keyframes starDriftMid {
  to {
    transform: translate3d(-6rem, 5rem, 0);
  }
}

@keyframes starDriftFront {
  to {
    transform: translate3d(7rem, -4rem, 0);
  }
}

@keyframes starPulse {
  from {
    opacity: 0.28;
  }

  to {
    opacity: 0.62;
  }
}

@keyframes galaxyFloatOne {
  to {
    transform: translate3d(2.5rem, 1rem, 0) rotate(-8deg) scale(1.08);
  }
}

@keyframes galaxyFloatTwo {
  to {
    transform: translate3d(-2rem, -1.5rem, 0) rotate(10deg) scale(1.06);
  }
}

@keyframes shootingStar {
  0%,
  62% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(-28deg);
  }

  66% {
    opacity: 0.9;
  }

  76%,
  100% {
    opacity: 0;
    transform: translate3d(-18rem, 10rem, 0) rotate(-28deg);
  }
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    min-height: auto;
  }

  .brand-side {
    justify-items: center;
    text-align: center;
  }

  .brand-logo {
    width: min(100%, 25rem);
  }

  .welcome-copy,
  .welcome-copy h1 {
    max-width: 26rem;
  }
}

@media (max-width: 480px) {
  .home-page {
    padding: 0.75rem;
  }

  .brand-logo {
    width: min(100%, 19rem);
  }

  .welcome-copy h1 {
    font-size: 1.45rem;
  }

  .galaxy {
    opacity: 0.28;
  }
}
</style>
