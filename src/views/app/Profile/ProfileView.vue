<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue';
import { Api } from '@/services/api';
import { useUserStore } from '@/stores/user';
import type { UserProfile } from '@/types/types';
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const api = new Api();
const userStore = useUserStore();
const toast = useToast();
const form = ref({ nome: userStore.user?.nome || '', email: userStore.user?.email || '' });
const password = ref({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
const photoInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const savingDetails = ref(false);
const savingPassword = ref(false);
const uploadingPhoto = ref(false);

function updateSession(profile: UserProfile): void {
  if (!userStore.user) return;
  userStore.setUser({ ...userStore.user, ...profile });
  form.value = { nome: profile.nome, email: profile.email };
}

function message(error: unknown): string {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
    if ('message' in error) return String(error.message);
  }
  return 'Não foi possível concluir a operação.';
}

onMounted(async () => {
  loading.value = true;
  try {
    updateSession(await api.getProfile());
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao carregar perfil', detail: message(error), life: 4500 });
  } finally {
    loading.value = false;
  }
});

async function saveDetails(): Promise<void> {
  if (!form.value.nome.trim() || !form.value.email.trim()) {
    toast.add({ severity: 'warn', summary: 'Revise os dados', detail: 'Informe nome e email.', life: 3500 });
    return;
  }
  savingDetails.value = true;
  try {
    updateSession(await api.updateProfile({ nome: form.value.nome.trim(), email: form.value.email.trim() }));
    toast.add({ severity: 'success', summary: 'Perfil atualizado', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao salvar', detail: message(error), life: 4500 });
  } finally {
    savingDetails.value = false;
  }
}

async function savePassword(): Promise<void> {
  if (password.value.nova_senha !== password.value.confirmar_senha) {
    toast.add({ severity: 'warn', summary: 'Senhas diferentes', detail: 'Confirme a nova senha corretamente.', life: 3500 });
    return;
  }
  savingPassword.value = true;
  try {
    await api.changeProfilePassword({
      senha_atual: password.value.senha_atual,
      nova_senha: password.value.nova_senha,
    });
    if (userStore.user) userStore.setUser({ ...userStore.user, senha: password.value.nova_senha });
    password.value = { senha_atual: '', nova_senha: '', confirmar_senha: '' };
    toast.add({ severity: 'success', summary: 'Senha alterada', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao alterar senha', detail: message(error), life: 4500 });
  } finally {
    savingPassword.value = false;
  }
}

async function selectPhoto(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    toast.add({ severity: 'warn', summary: 'Foto inválida', detail: 'Use JPG, PNG ou WebP com até 5 MB.', life: 3500 });
    input.value = '';
    return;
  }
  uploadingPhoto.value = true;
  try {
    updateSession(await api.uploadProfilePhoto(file));
    toast.add({ severity: 'success', summary: 'Foto atualizada', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erro ao enviar foto', detail: message(error), life: 4500 });
  } finally {
    uploadingPhoto.value = false;
    input.value = '';
  }
}
</script>

<template>
  <section class="profile-page app-page">
    <header class="section-header">
      <div>
        <h2>Meu perfil</h2>
        <span>Atualize os dados da sua conta e sua foto.</span>
      </div>
    </header>

    <div class="profile-grid">
      <Card class="profile-photo-card">
        <template #content>
          <div class="photo-content">
            <UserAvatar :name="userStore.user?.nome || 'Usuário'" :photo="userStore.user?.foto" large />
            <div class="photo-info">
              <strong>{{ userStore.user?.nome || 'Usuário' }}</strong>
              <span>{{ userStore.user?.email }}</span>
            </div>
            <input ref="photoInput" class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp"
              aria-label="Selecionar foto de perfil" @change="selectPhoto" />
            <Button label="Trocar foto" icon="pi pi-camera" severity="secondary" :loading="uploadingPhoto"
              :disabled="loading" @click="photoInput?.click()" />
            <small>JPG, PNG ou WebP. Até 5 MB.</small>
          </div>
        </template>
      </Card>

      <div class="profile-forms">
        <Card>
          <template #title>Dados da conta</template>
          <template #content>
            <form class="profile-form" @submit.prevent="saveDetails">
              <div><label for="profile-name" class="label">Nome</label><InputText id="profile-name" v-model="form.nome" class="w-full" autocomplete="name" maxlength="100" /></div>
              <div><label for="profile-email" class="label">Email</label><InputText id="profile-email" v-model="form.email" class="w-full" type="email" autocomplete="email" maxlength="100" /></div>
              <div class="form-actions"><Button type="submit" label="Salvar dados" icon="pi pi-check" :loading="savingDetails" :disabled="loading" /></div>
            </form>
          </template>
        </Card>

        <Card>
          <template #title>Alterar senha</template>
          <template #content>
            <form class="profile-form" @submit.prevent="savePassword">
              <div><label for="current-password" class="label">Senha atual</label><InputText id="current-password" v-model="password.senha_atual" class="w-full" type="password" autocomplete="current-password" /></div>
              <div><label for="new-password" class="label">Nova senha</label><InputText id="new-password" v-model="password.nova_senha" class="w-full" type="password" autocomplete="new-password" minlength="8" maxlength="72" /></div>
              <div><label for="confirm-password" class="label">Confirmar nova senha</label><InputText id="confirm-password" v-model="password.confirmar_senha" class="w-full" type="password" autocomplete="new-password" /></div>
              <div class="form-actions"><Button type="submit" label="Alterar senha" icon="pi pi-lock" :loading="savingPassword" :disabled="loading" /></div>
            </form>
          </template>
        </Card>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.profile-grid { display: grid; grid-template-columns: minmax(15rem, 19rem) minmax(0, 1fr); gap: .85rem; align-items: start; }
.profile-forms { display: grid; gap: .85rem; }
.photo-content { display: grid; justify-items: center; gap: .9rem; padding: .5rem 0; text-align: center; }
.photo-info { display: grid; gap: .2rem; min-width: 0; max-width: 100%; }
.photo-info strong, .photo-info span { overflow-wrap: anywhere; }
.photo-info strong { color: var(--app-text); }
.photo-info span, .photo-content small { color: var(--app-text-muted); font-size: .8rem; }
.profile-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.profile-form > div { min-width: 0; }
.profile-form .form-actions { display: flex; align-items: end; justify-content: flex-end; grid-column: 1 / -1; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .profile-form { grid-template-columns: 1fr; } }
</style>
