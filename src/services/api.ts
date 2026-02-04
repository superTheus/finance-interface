import type { BankAccounts, BankAccountsRequest, Bills, BillsRequest, Categories, CategoriesRequest, PartialBankAccounts, PartialBills, PartialCategories, PartialUser, PaymentsForms, ResumeBills, ResumeBillsYearly, User } from '@/types/types';
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

  createUser(user: PartialUser): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/root/usuarios/criar', user);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
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
        reject(error.response.data);
      }
    })
  }

  createBills(bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.post(`/private/contas/criar`, bill);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
      }
    })
  }

  updateBills(id: number, bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/private/contas/atualizar/${id}`, bill);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
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
        const response = await this.instance.post('/private/contas-bancarias/listar', filter);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  createCategory(data: Categories): Promise<Categories> {
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
}
