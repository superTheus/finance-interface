export type request = {
  limit?: number,
  offset?: number,
  order?: {
    cols: (keyof Bills)[],
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
  dthr_registro: string,
  dthr_atualizacao: string
}

export interface Config {
  darkMode: boolean
}

export interface Bills {
  id?: number,
  id_usuario: number,
  id_forma_pagamento?: number,
  id_conta_bancaria?: number,
  titulo: string,
  descricao: string,
  valor: number,
  valor_pago: number,
  tipo: "D" | "R",
  status: "PN" | "PA",
  vencimento: string,
  parcelas?: number,
  num_parcela?: number,
  conta_agrupada: "N",
  id_conta_resultante?: number,
  id_original?: number,
  frequencia?: number,
  total_parcelas?: number,
  modo_pagamento?: "T" | "P",
  data_pagamento?: string,
  deletado?: "N" | "S",
  dthr_registro: string
}

export type PartialBills = Partial<Bills>;

export interface BillsRequest extends request {
  filter?: PartialBills
}

export type ResumeBills = {
  total_falta_pagar: number,
  total_falta_receber: number,
  total_despesas: number,
  total_receitas: number,
  total_pago: number,
  total_recebido: number,
  saldo: number,
}

export type PaymentsForms = {
  id: number,
  descricao: "DINHEIRO" | "CARTÃO DE CRÉDITO" | "CARTÃO DE DÉBITO" | "PIX",
}

export interface BankAccounts {
  id: number,
  id_user: number,
  user: number,
  descricao: string,
  observacoes: string,
  saldo: number,
  principal: "S" | "N",
  deletado: "S" | "N",
}

export type PartialBankAccounts = Partial<BankAccounts>;

export interface BankAccountsRequest extends request {
  filter?: PartialBankAccounts,
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
  statusFilter: 'TO' | 'PN' | 'PA',
  type: 'TO' | 'D' | 'R',
  datePeriod: Date[]
}
