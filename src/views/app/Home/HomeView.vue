<script setup lang="ts">
import { AgentApi } from '@/services/agentApi';
import { computed, nextTick, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: number;
  role: ChatRole;
  content: string;
  createdAt: Date;
  failed?: boolean;
};

const welcomeMessage = 'Ola! Sou seu agente financeiro. Posso consultar suas contas, receitas, despesas, saldos e vencimentos. Como posso ajudar hoje?';
const fallbackAnswer = 'O agente respondeu, mas nao retornou um texto para exibir.';
const quickPrompts = [
  'Quais despesas vencem este mes?',
  'Mostre um resumo financeiro do mes',
  'Qual meu saldo previsto?',
  'Liste minhas receitas pendentes',
];

const agentApi = new AgentApi();
const toast = useToast();
const prompt = ref('');
const loading = ref(false);
const messagesEl = ref<HTMLElement | null>(null);
const messages = ref<ChatMessage[]>([
  {
    id: 1,
    role: 'assistant',
    content: welcomeMessage,
    createdAt: new Date(),
  },
]);

let nextMessageId = 2;

const canSend = computed(() => prompt.value.trim().length > 0 && !loading.value);

const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

const scrollToBottom = async () => {
  await nextTick();

  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
};

const addMessage = (role: ChatRole, content: string, failed = false) => {
  messages.value.push({
    id: nextMessageId,
    role,
    content,
    failed,
    createdAt: new Date(),
  });
  nextMessageId += 1;
};

const resetChat = () => {
  messages.value = [
    {
      id: 1,
      role: 'assistant',
      content: welcomeMessage,
      createdAt: new Date(),
    },
  ];
  nextMessageId = 2;
  prompt.value = '';
  scrollToBottom();
};

const sendMessage = async (content = prompt.value) => {
  const message = content.trim();

  if (!message || loading.value) {
    return;
  }

  addMessage('user', message);
  prompt.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await agentApi.chat(message);
    addMessage('assistant', response.answer?.trim() || fallbackAnswer);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Nao foi possivel conversar com o agente financeiro agora.';

    addMessage('assistant', detail, true);
    toast.add({
      severity: 'error',
      summary: 'Erro no agente',
      detail,
      life: 5000,
    });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};

const handlePromptKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};
</script>

<template>
  <section class="chat-page app-page">
    <div class="chat-shell orbit-panel">
      <header class="chat-header">
        <div class="agent-badge">
          <span class="agent-icon">
            <i class="pi pi-sparkles"></i>
          </span>
          <div>
            <h2>Agente financeiro</h2>
            <small>Online</small>
          </div>
        </div>

        <Button
          icon="pi pi-refresh"
          aria-label="Reiniciar conversa"
          severity="secondary"
          text
          rounded
          class="reset-button"
          @click="resetChat"
        />
      </header>

      <div ref="messagesEl" class="messages" aria-live="polite">
        <article
          v-for="message in messages"
          :key="message.id"
          :class="['message-row', message.role, { failed: message.failed }]"
        >
          <span class="message-avatar">
            <i :class="message.role === 'assistant' ? 'pi pi-sparkles' : 'pi pi-user'"></i>
          </span>

          <div class="message-content">
            <div class="message-bubble">
              <p>{{ message.content }}</p>
            </div>
            <time>{{ formatTime(message.createdAt) }}</time>
          </div>
        </article>

        <article v-if="loading" class="message-row assistant">
          <span class="message-avatar">
            <i class="pi pi-sparkles"></i>
          </span>
          <div class="message-content">
            <div class="message-bubble typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </article>
      </div>

      <footer class="composer">
        <div class="quick-prompts">
          <button
            v-for="item in quickPrompts"
            :key="item"
            type="button"
            :disabled="loading"
            @click="sendMessage(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="composer-box">
          <Textarea
            v-model="prompt"
            rows="1"
            autoResize
            class="prompt-input"
            placeholder="Pergunte sobre suas financas"
            :disabled="loading"
            @keydown="handlePromptKeydown"
          />
          <Button
            icon="pi pi-send"
            aria-label="Enviar mensagem"
            class="send-button"
            :disabled="!canSend"
            :loading="loading"
            @click="sendMessage()"
          />
        </div>
      </footer>
    </div>
  </section>
</template>

<style scoped lang="scss">
.chat-page {
  height: 100%;
  min-height: 0;
  align-content: stretch;
}

.chat-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  width: min(100%, 62rem);
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border-bottom: 1px solid var(--app-border);
}

.agent-badge {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.7rem;
}

.agent-icon,
.message-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  flex: 0 0 auto;
  border-radius: 8px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--orbit-purple), var(--orbit-cyan));
}

.agent-badge h2,
.agent-badge small {
  display: block;
  margin: 0;
}

.agent-badge h2 {
  color: var(--app-text);
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.15;
}

.agent-badge small {
  color: var(--orbit-cyan);
  font-size: 0.72rem;
  font-weight: 800;
}

.reset-button {
  width: 2.35rem;
  height: 2.35rem;
  flex: 0 0 auto;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
  padding: clamp(0.9rem, 2vw, 1.25rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(108, 92, 231, 0.55) transparent;
}

.messages::-webkit-scrollbar {
  width: 8px;
}

.messages::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(108, 92, 231, 0.55);
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  max-width: min(47rem, 88%);
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.assistant {
  align-self: flex-start;
}

.message-row.user .message-avatar {
  color: var(--app-inverse);
  background: var(--app-text);
}

.message-row.failed .message-bubble {
  border-color: rgba(255, 84, 112, 0.38);
  color: var(--orbit-pink);
}

.message-content {
  display: grid;
  min-width: 0;
  gap: 0.25rem;
}

.message-row.user .message-content {
  justify-items: end;
}

.message-bubble {
  min-width: 0;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  background: color-mix(in srgb, var(--app-surface-strong), transparent 8%);
  box-shadow: 0 12px 26px rgba(11, 16, 32, 0.08);
}

.message-row.user .message-bubble {
  border-color: color-mix(in srgb, var(--orbit-purple), transparent 42%);
  color: #ffffff;
  background: linear-gradient(135deg, var(--orbit-purple), #8a6dff);
}

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
  line-height: 1.55;
}

time {
  color: var(--app-text-muted);
  font-size: 0.68rem;
  font-weight: 700;
}

.typing {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 4.25rem;
  min-height: 2.4rem;
}

.typing span {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--orbit-cyan);
  animation: typingPulse 1s ease-in-out infinite;
}

.typing span:nth-child(2) {
  animation-delay: 0.14s;
}

.typing span:nth-child(3) {
  animation-delay: 0.28s;
}

.composer {
  display: grid;
  gap: 0.65rem;
  padding: 0.75rem 0.9rem calc(0.75rem + var(--app-safe-area-bottom));
  border-top: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface), transparent 8%);
}

.quick-prompts {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
  scrollbar-width: none;
}

.quick-prompts::-webkit-scrollbar {
  display: none;
}

.quick-prompts button {
  flex: 0 0 auto;
  min-height: 2rem;
  max-width: 16rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  color: var(--app-text);
  background: var(--app-surface-soft);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-prompts button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.composer-box {
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  padding: 0.45rem;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--app-surface-strong), transparent 8%);
}

.prompt-input {
  width: 100%;
  max-height: 9rem;
}

.prompt-input :deep(textarea),
:deep(.prompt-input) {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.send-button {
  width: 2.55rem;
  height: 2.55rem;
  flex: 0 0 2.55rem;
}

@keyframes typingPulse {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  50% {
    transform: translateY(-0.18rem);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .chat-shell {
    width: 100%;
  }

  .chat-header {
    padding: 0.7rem;
  }

  .messages {
    gap: 0.85rem;
    padding: 0.75rem;
  }

  .message-row {
    max-width: 95%;
  }

  .message-avatar {
    width: 2rem;
    height: 2rem;
  }

  .composer {
    padding: 0.65rem 0.7rem calc(0.65rem + var(--app-safe-area-bottom));
  }
}

@media (max-width: 425px) {
  .agent-badge h2 {
    font-size: 0.9rem;
  }

  .message-row {
    max-width: 100%;
    gap: 0.45rem;
  }

  .message-avatar {
    display: none;
  }

  .message-bubble {
    padding: 0.68rem 0.72rem;
  }

  .quick-prompts button {
    max-width: 13rem;
  }
}
</style>
