import type {
  BankAccounts, BankAccountsRequest, Bills, BillsRequest, Categories, CategoriesRequest,
  CategorySummary, CreditCard, CreditCardInput, FinancialSettings, Notas, PartialBankAccounts, PartialBills, PeriodMonthlyTotal,
  PartialCategories, PartialUser, PaymentsForms, PurchaseItem, PurchaseOption,
  PurchasePlanRequest, PurchasePlanResponse, PurchaseProjection, ResumeBills,
  ResumeBillsYearly, User, UserProfile
} from '@/types/types';
import { getUser } from '@/stores/store';
import axios, { type AxiosInstance } from 'axios';

export class Api {
  private instance!: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    this.instance.interceptors.request.use((config) => {
      const user = getUser();

      if (user?.token && config.headers) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }

      return config;
    });
  }

  login(email: string, password: string): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/login', {
          email: email,
          senha: password
        });

        resolve(response.data);
      } catch (error: any) {
        reject(error.response?.data || error.response || error);
      }
    })
  }

  async loginWithGoogle(params: { code: string; code_verifier: string; redirect_uri: string }): Promise<User> {
    try {
      const response = await this.instance.post('/login-google', params);
      return response.data as User;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.instance.get('/private/perfil/');
    return response.data as UserProfile;
  }

  async updateProfile(data: { nome: string; email: string }): Promise<UserProfile> {
    const response = await this.instance.put('/private/perfil/', data);
    return response.data as UserProfile;
  }

  async changeProfilePassword(data: { senha_atual: string; nova_senha: string }): Promise<void> {
    await this.instance.put('/private/perfil/senha', data);
  }

  async uploadProfilePhoto(file: File): Promise<UserProfile> {
    const form = new FormData();
    form.append('foto', file);
    const response = await this.instance.post('/private/perfil/foto', form, {
      headers: { 'Content-Type': undefined },
    });
    return response.data as UserProfile;
  }

  async listCreditCards(): Promise<CreditCard[]> {
    const response = await this.instance.get('/private/cartoes-credito/');
    return response.data.data as CreditCard[];
  }

  async createCreditCard(data: CreditCardInput): Promise<CreditCard> {
    const response = await this.instance.post('/private/cartoes-credito/', data);
    return response.data as CreditCard;
  }

  async updateCreditCard(id: number, data: CreditCardInput): Promise<CreditCard> {
    const response = await this.instance.put(`/private/cartoes-credito/${id}`, data);
    return response.data as CreditCard;
  }

  async deleteCreditCard(id: number): Promise<void> {
    await this.instance.delete(`/private/cartoes-credito/${id}`);
  }

  createUser(user: PartialUser): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/root/usuarios/criar', user);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response?.data || error);
      }
    })
  }

  findBills(filters?: BillsRequest): Promise<{
    total: number,
    data: Bills[]
  }> {
    return new Promise<{
      total: number,
      data: Bills[]
    }>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/contas/listar', filters);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response?.data || error);
      }
    })
  }

  createBills(bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.post(`/private/contas/criar`, bill);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response?.data || error);
      }
    })
  }

  updateBills(id: number, bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/private/contas/atualizar/${id}`, bill, { timeout: 30000 });
        resolve(response.data);
      } catch (error: any) {
        reject(error.response?.data || error);
      }
    })
  }

  resumes(data: {
    inicio: string,
    fim: string,
    usuario: number
  }): Promise<ResumeBills> {
    return new Promise<ResumeBills>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/resumos/geral', data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  resumesYear(data: {
    ano: number,
    usuario: number
  }): Promise<ResumeBillsYearly[]> {
    return new Promise<ResumeBillsYearly[]>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/resumos/anual', data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  async resumesPeriod(data: { inicio: string, fim: string }): Promise<PeriodMonthlyTotal[]> {
    try {
      const response = await this.instance.post('/private/resumos/periodo', data);
      return response.data as PeriodMonthlyTotal[];
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  payments(): Promise<PaymentsForms[]> {
    return new Promise<PaymentsForms[]>(async (resolve, reject) => {
      try {
        const response = await this.instance.get('/payments-forms');

        resolve(response.data.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  findBankAccounts(filter: BankAccountsRequest): Promise<{
    total: number,
    data: BankAccounts[]
  }> {
    return new Promise<{
      total: number,
      data: BankAccounts[]
    }>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/contas-bancarias/listar', filter);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  createBankAccount(data: PartialBankAccounts): Promise<BankAccounts> {
    return new Promise<BankAccounts>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/contas-bancarias/criar', data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  updateBankAccount(id: number, data: PartialBankAccounts): Promise<BankAccounts> {
    return new Promise<BankAccounts>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/private/contas-bancarias/atualizar/${id}`, data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  findCategories(filter: CategoriesRequest): Promise<{
    total: number,
    data: Categories[]
  }> {
    return new Promise<{
      total: number,
      data: Categories[]
    }>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/categorias/listar', filter);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  createCategory(data: PartialCategories): Promise<Categories> {
    return new Promise<Categories>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/private/categorias/criar', data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  updateCategory(id: number, data: PartialCategories): Promise<Categories> {
    return new Promise<Categories>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/private/categorias/atualizar/${id}`, data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  async setCategoryActive(id: number, active: boolean): Promise<Categories> {
    try {
      const action = active ? 'ativar' : 'inativar';
      const response = await this.instance.patch(`/private/categorias/${action}/${id}`);
      return response.data as Categories;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async deleteCategory(id: number): Promise<{ success?: boolean, message?: string, inativada?: boolean }> {
    try {
      const response = await this.instance.delete(`/private/categorias/excluir/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async categorySummary(data: {
    inicio: string,
    fim: string,
    modo: 'realizado' | 'previsto'
  }): Promise<CategorySummary> {
    try {
      const response = await this.instance.post('/private/resumos/categorias', data);
      return response.data as CategorySummary;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getFinancialSettings(): Promise<FinancialSettings> {
    try {
      const response = await this.instance.get('/private/configuracoes-financeiras');
      return response.data as FinancialSettings;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async updateFinancialSettings(data: FinancialSettings): Promise<FinancialSettings> {
    try {
      const response = await this.instance.put('/private/configuracoes-financeiras', data);
      return response.data as FinancialSettings;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async findPurchaseItems(data: PurchasePlanRequest = {}): Promise<PurchasePlanResponse> {
    try {
      const response = await this.instance.post('/private/plano-compras/listar', data);
      return response.data as PurchasePlanResponse;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async createPurchaseItem(data: Partial<PurchaseItem>): Promise<PurchaseItem> {
    try {
      const response = await this.instance.post('/private/plano-compras/criar', data);
      return response.data as PurchaseItem;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async getPurchaseItem(id: number): Promise<PurchaseItem> {
    try {
      const response = await this.instance.get(`/private/plano-compras/${id}`);
      return response.data as PurchaseItem;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async updatePurchaseItem(id: number, data: Partial<PurchaseItem>): Promise<PurchaseItem> {
    try {
      const response = await this.instance.put(`/private/plano-compras/atualizar/${id}`, data);
      return response.data as PurchaseItem;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async deletePurchaseItem(id: number): Promise<void> {
    try {
      await this.instance.delete(`/private/plano-compras/excluir/${id}`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async changePurchaseItemStatus(id: number, action: 'cancelar' | 'arquivar'): Promise<PurchaseItem> {
    try {
      const response = await this.instance.patch(`/private/plano-compras/${id}/${action}`);
      return response.data as PurchaseItem;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async projectPurchaseItem(
    id: number,
    modo: 'individual' | 'plano_completo' = 'individual'
  ): Promise<PurchaseProjection> {
    try {
      const response = await this.instance.post(`/private/plano-compras/${id}/projetar`, { modo });
      return response.data as PurchaseProjection;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async projectAllPurchaseItems(): Promise<{
    modo: 'plano_completo',
    saldo_inicial_projecao: number,
    reserva_minima: number,
    saldo_disponivel_agora: number,
    horizonte_analisado_ate: string,
    itens: PurchaseProjection[],
    alertas: string[]
  }> {
    try {
      const response = await this.instance.post('/private/plano-compras/projetar-todos');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async createPurchaseOption(itemId: number, data: Partial<PurchaseOption>): Promise<PurchaseOption> {
    try {
      const response = await this.instance.post(`/private/plano-compras/${itemId}/opcoes/criar`, data);
      return response.data as PurchaseOption;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async updatePurchaseOption(
    itemId: number,
    optionId: number,
    data: Partial<PurchaseOption>
  ): Promise<PurchaseOption> {
    try {
      const response = await this.instance.put(
        `/private/plano-compras/${itemId}/opcoes/${optionId}`,
        data
      );
      return response.data as PurchaseOption;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async deletePurchaseOption(itemId: number, optionId: number): Promise<void> {
    try {
      await this.instance.delete(`/private/plano-compras/${itemId}/opcoes/${optionId}`);
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async selectPurchaseOption(itemId: number, optionId: number): Promise<PurchaseOption> {
    try {
      const response = await this.instance.patch(
        `/private/plano-compras/${itemId}/opcoes/${optionId}/selecionar`
      );
      return response.data as PurchaseOption;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  async buyPurchaseItem(id: number, data: {
    data_compra: string,
    valor_pago: number,
    loja?: string,
    link?: string,
    observacao?: string,
    criar_conta: boolean,
    id_categoria?: number,
    id_conta_bancaria?: number,
    id_forma_pagamento?: number,
    id_cartao_credito?: number,
    parcelas_cartao?: number,
    opcao_id?: number
  }): Promise<PurchaseItem> {
    try {
      const response = await this.instance.patch(`/private/plano-compras/${id}/comprar`, data);
      return response.data as PurchaseItem;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  notas = {
    listar: async (data: any): Promise<Notas[]> => {
      try {
        const response = await this.instance.post(`/private/notas/listar`, data);
        return response.data as Notas[];
      } catch (error: any) {
        throw error.response;
      }
    },
    criar: async (data: Notas): Promise<Notas> => {
      try {
        const response = await this.instance.post(`/private/notas/criar`, data);
        return response.data as Notas;
      } catch (error: any) {
        throw error.response;
      }
    },
    atualizar: async (id: number, data: Partial<Notas>): Promise<Notas> => {
      try {
        const response = await this.instance.put(`/private/notas/atualizar/${id}`, data);
        return response.data as Notas;
      } catch (error: any) {
        throw error.response;
      }
    }
  }
}
