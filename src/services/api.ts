import type { User } from '@/types/types';
import axios, { type AxiosInstance } from 'axios';

export class Api {
  private instance!: AxiosInstance;

  constructor() {
    console.log(import.meta.env.VITE_API_BASE_URL);
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
}
