export type request = {
  limit?: number,
  offset?: number,
  order?: {
    cols: string[],
    direction: "ASC" | "DESC"
  },
  date_ranger?: {
    start_date: string,
    end_date: string
  }
}

export interface User {
  id: number,
  nome: string,
  email: string,
  senha: string,
  deletado?: "S" | "N",
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type PartialUser = Partial<User>;

export interface Config {
  darkMode: boolean
}

export interface Bills {
  id?: number,
  id_usuario: number,
  id_forma_pagamento?: number,
  id_conta_bancaria?: number,
  id_categoria?: number,
  token_unico?: string,
  titulo: string,
  descricao: string,
  valor: number,
  valor_pago?: number,
  tipo: "D" | "R",
  status: "PE" | "PA",
  vencimento: string | {
    BETWEEN?: [string, string]
    AND?: string
    OR?: string
  },
  parcelas?: number,
  num_parcela?: number,
  conta_agrupada?: "S" | "N",
  id_conta_resultante?: number,
  id_original?: number,
  frequencia?: number,
  valor_total_parcelas?: number,
  modo_pagamento?: "T" | "P",
  data_pagamento?: string,
  deletado?: "N" | "S",
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type BillsForm = {
  titulo: string,
  descricao: string,
  valor: number,
  vencimento: string,
  usa_parcelas: boolean,
  parcelas?: number,
  num_parcela?: number,
  usa_frequencia?: boolean,
  frequencia?: number,
};

export type PartialBills = Partial<Bills>;

export interface BillsRequest extends request {
  filter?: PartialBills
}

export type ResumeBills = {
  totalPagar: number,
  totalFaltaPagar: number,
  totalPago: number,
  totalReceber: number,
  totalFaltaReceber: number,
  totalRecebido: number,
  quantidadeFaltaPagar: number,
  quantidadePaga: number,
  quantidadeTotalPagar: number,
  quantidadeFaltaReceber: number,
  quantidadeRecebida: number,
  quantidadeTotalReceber: number,
  saldo: number
}

export type ResumeBillsYearly = {
  mes: "janeiro" | "fevereiro" | "março" | "abril" | "maio" | "junho" | "julho" | "agosto" | "setembro" | "outubro" | "novembro" | "dezembro",
  totalPagar: number,
  totalReceber: number,
  saldo: number
}

export type PaymentsForms = {
  id: number,
  descricao: "DINHEIRO" | "CARTÃO DE CRÉDITO" | "CARTÃO DE DÉBITO" | "PIX",
}

export interface BankAccounts {
  id: number,
  id_usuario: number,
  descricao: string,
  observacoes: string,
  saldo: number,
  principal: "S" | "N",
  deletado: "S" | "N",
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type PartialBankAccounts = Partial<BankAccounts>;

export interface BankAccountsRequest extends request {
  filter?: PartialBankAccounts,
}

export interface Categories {
  id: number,
  id_usuario: number,
  descricao: string,
  deletado: "S" | "N",
  dthr_criacao?: string,
  dthr_atualizacao?: string
}

export type PartialCategories = Partial<Categories>;

export interface CategoriesRequest extends request {
  filter?: PartialCategories,
}

export type FilterBill = {
  period: {
    label: string,
    value: 1 | 2 | 3
  },
  month: {
    label: string,
    value: number
  },
  radioTypeFilterPeriod: 'mounth' | 'date',
  statusFilter: 'TO' | 'PE' | 'PA',
  type: 'TO' | 'D' | 'R',
  datePeriod: Date[]
}
