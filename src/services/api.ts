import type { BankAccounts, BankAccountsRequest, Bills, BillsRequest, PartialBankAccounts, PartialBills, PartialUser, PaymentsForms, ResumeBills, User } from '@/types/types';
import axios, { type AxiosInstance } from 'axios';

export class Api {
  private instance!: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
      headers: { 'X-Custom-Header': 'foobar' }
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
        reject(error.response.data);
      }
    })
  }

  createUser(user: PartialUser): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/user/create', user);

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
        const response = await this.instance.post('/contas/list', filters);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
      }
    })
  }

  createBills(bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.post(`/contas/create`, bill);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
      }
    })
  }

  updateBills(id: number, bill: PartialBills): Promise<Bills> {
    return new Promise<Bills>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/contas/update/${id}`, bill);
        resolve(response.data);
      } catch (error: any) {
        reject(error.response.data);
      }
    })
  }

  resumes(data: {
    date_ranger: {
      start_date: string,
      end_date: string
    },
    filter: PartialBills
  }): Promise<ResumeBills> {
    return new Promise<ResumeBills>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/resumes/values', data);

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

        resolve(response.data);
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
        const response = await this.instance.post('/bank-account/list', filter);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  createBankAccount(data: PartialBankAccounts): Promise<BankAccounts> {
    return new Promise<BankAccounts>(async (resolve, reject) => {
      try {
        const response = await this.instance.post('/bank-account/create', data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }

  updateBankAccount(id: number, data: PartialBankAccounts): Promise<BankAccounts> {
    return new Promise<BankAccounts>(async (resolve, reject) => {
      try {
        const response = await this.instance.put(`/bank-account/update/${id}`, data);

        resolve(response.data);
      } catch (error: any) {
        reject(error.response);
      }
    })
  }
}
