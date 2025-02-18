import type { off } from "process"

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
  titulo: string,
  descricao: string,
  valor: number,
  valor_pago: number,
  tipo: "D" | "R",
  status: "PN" | "PG",
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

export interface BillsRequest {
  filter?: PartialBills,
  limit?: number,
  offset?: number,
  order?: {
    cols: (keyof Bills)[],
    order: "ASC" | "DESC"
  },
  date_ranger?: {
    start_date: string,
    end_date: string
  }
}
