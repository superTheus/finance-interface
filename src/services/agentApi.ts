import { getUser } from '@/stores/store';
import axios, { isAxiosError, type AxiosInstance } from 'axios';

export type AgentChatResponse = {
  answer: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
};

const missingCredentialsMessage = 'Sua sessao nao tem as credenciais necessarias para conversar com o agente. Saia e entre novamente.';
const agentBaseUrl = import.meta.env.VITE_AGENT_URL_BASE?.trim();

function encodeBasicAuth(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email}:${password}`);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function extractErrorMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    return data;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as { message?: unknown; error?: unknown; detail?: unknown };

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  return null;
}

function normalizeAgentError(error: unknown) {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const message = extractErrorMessage(error.response?.data) || error.message;

    if (status === 401) {
      return new Error('Nao foi possivel autenticar no agente financeiro. Saia e entre novamente para atualizar sua sessao.');
    }

    return new Error(message || 'Nao foi possivel conversar com o agente financeiro agora.');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Nao foi possivel conversar com o agente financeiro agora.');
}

export class AgentApi {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: agentBaseUrl,
      timeout: 180000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.instance.interceptors.request.use((config) => {
      const user = getUser();

      if (!user?.email || !user.senha) {
        throw new Error(missingCredentialsMessage);
      }

      if (config.headers) {
        config.headers.Authorization = `Basic ${encodeBasicAuth(user.email, user.senha)}`;
      }

      return config;
    });
  }

  async chat(message: string): Promise<AgentChatResponse> {
    if (!agentBaseUrl) {
      throw new Error('O agente financeiro não está configurado neste ambiente.');
    }
    try {
      const response = await this.instance.post<AgentChatResponse>('/api/agent/chat', { message });
      return response.data;
    } catch (error) {
      throw normalizeAgentError(error);
    }
  }
}
