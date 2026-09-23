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
  foto?: string | null,
  token?: string,
  senha?: string,
  deletado?: "S" | "N",
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type PartialUser = Partial<User>;

export type UserProfile = Pick<User, 'id' | 'nome' | 'email' | 'foto'>;

export interface Config {
  darkMode: boolean
}

export interface Bills {
  id?: number,
  id_usuario: number,
  id_forma_pagamento?: number,
  id_conta_bancaria?: number,
  id_categoria?: number,
  categoria?: Categories,
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
  filter?: PartialBills,
  search?: string
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

export type PeriodMonthlyTotal = {
  mes: string,
  totalReceber: number,
  totalPagar: number,
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
  id?: number,
  id_usuario: number,
  nome: string,
  nome_normalizado?: string,
  descricao?: string,
  cor?: string,
  icone?: string,
  tipo: "D" | "R" | "A",
  ativo: "S" | "N",
  deletado?: "S" | "N",
  dthr_criacao?: string,
  dthr_registro?: string
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
  search: string,
  categoryId?: number | null,
  datePeriod: Date[]
}

export type Notas = {
  id?: number,
  id_usuario: number,
  titulo: string,
  texto: string,
  arquivado: "S" | "N",
  deletado: "S" | "N",
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type FinancialSettings = {
  id?: number,
  id_usuario?: number,
  reserva_minima: number,
  utilizar_reserva: "S" | "N",
  horizonte_meses: 3 | 6 | 12,
  dthr_registro?: string,
  dthr_atualizacao?: string
}

export type PurchasePriority = "A" | "M" | "B";
export type PurchaseStatus =
  | "planejado"
  | "em_pesquisa"
  | "disponivel"
  | "programado"
  | "comprado"
  | "cancelado"
  | "arquivado";

export interface PurchaseOption {
  id?: number,
  id_item_desejo?: number,
  nome_loja: string,
  descricao?: string,
  link: string,
  valor: number,
  frete?: number | null,
  valor_total?: number,
  data_pesquisa: string,
  observacao?: string,
  disponivel: "S" | "N",
  selecionada?: "S" | "N",
  deletado?: "S" | "N",
  data_possivel?: string | null,
  mes_possivel?: string | null,
  situacao_orcamento?: "cabe_agora" | "mes_futuro" | "fora_horizonte" | "indisponivel" | "selecionada" | "comprada"
}

export interface FinancialTimelinePoint {
  data: string,
  receitas: number,
  despesas: number,
  saldo: number,
  saldo_disponivel: number,
  eventos: {
    id?: number,
    titulo: string,
    tipo: "D" | "R",
    valor: number,
    origem: string,
    vencida?: boolean,
    item_id?: number
  }[]
}

export interface PurchaseProjection {
  item_id: number,
  modo: "individual" | "plano_completo",
  status_projecao: "inconclusiva" | "disponivel" | "futura" | "fora_horizonte",
  pode_comprar_agora: boolean,
  data_sugerida: string | null,
  mes_sugerido: string | null,
  valor_usado_no_calculo: number,
  fonte_valor: "menor_opcao_disponivel" | "valor_minimo_manual",
  saldo_antes_da_compra: number | null,
  reserva_minima: number,
  saldo_disponivel_antes_da_compra: number | null,
  saldo_apos_compra: number | null,
  saldo_livre_apos_compra: number | null,
  saldo_minimo_futuro_apos_compra: number | null,
  saldo_fim_mes_apos_compra: number | null,
  saldo_minimo_mes_apos_compra: number | null,
  despesas_mes_seguinte: number | null,
  folga_apos_cobrir_mes_seguinte: number | null,
  horizonte_analisado_ate: string,
  motivo: string,
  opcoes_recomendadas: PurchaseOption[],
  opcoes_fora_do_orcamento: PurchaseOption[],
  linha_tempo: FinancialTimelinePoint[],
  alertas: string[]
}

export interface PurchaseItem {
  id?: number,
  id_usuario?: number,
  nome: string,
  descricao?: string,
  classificacao: string,
  prioridade: PurchasePriority,
  valor_minimo: number,
  valor_maximo?: number | null,
  valor_referencia?: number | null,
  valor_minimo_manual?: number,
  valor_maximo_manual?: number | null,
  data_desejada?: string | null,
  observacoes?: string,
  status: PurchaseStatus,
  comprado?: "S" | "N",
  data_compra?: string | null,
  valor_pago?: number | null,
  loja_escolhida?: string | null,
  link_escolhido?: string | null,
  id_conta_compra?: number | null,
  deletado?: "S" | "N",
  quantidade_opcoes?: number,
  menor_opcao?: number | null,
  maior_opcao?: number | null,
  media_opcoes?: number | null,
  projecao?: PurchaseProjection,
  opcoes?: PurchaseOption[],
  historico?: PurchaseHistory[],
  projecao_individual?: PurchaseProjection,
  projecao_plano_completo?: PurchaseProjection
}

export interface PurchaseHistory {
  id: number,
  acao: string,
  dados?: Record<string, string | number | boolean | null>,
  dthr_registro: string
}

export interface PurchasePlanSummary {
  total_itens_planejados: number,
  itens_disponiveis_agora: number,
  itens_meses_futuros: number,
  itens_comprados: number,
  valor_total_desejos: number,
  menor_custo_possivel: number,
  reserva_minima: number,
  saldo_disponivel_compras: number,
  proxima_compra_sugerida: (PurchaseProjection & { nome: string }) | null,
  alertas: string[]
}

export interface PurchasePlanResponse {
  total: number,
  data: PurchaseItem[],
  resumo: PurchasePlanSummary
}

export interface PurchasePlanRequest extends request {
  filter?: {
    pesquisa?: string,
    status?: PurchaseStatus,
    prioridade?: PurchasePriority,
    classificacao?: string,
    comprado?: "S" | "N"
  }
}

export interface CategorySummaryItem {
  id_categoria: number | null,
  categoria: string,
  cor: string,
  icone: string,
  total: number,
  quantidade: number,
  posicao: number,
  percentual: number,
  total_periodo_anterior: number,
  evolucao_percentual: number | null
}

export interface CategorySummary {
  modo: "realizado" | "previsto",
  regra_data: "data_pagamento" | "vencimento",
  inicio: string,
  fim: string,
  total_gasto: number,
  categoria_maior_gasto: CategorySummaryItem | null,
  percentual_maior_categoria: number,
  quantidade_sem_categoria: number,
  media_por_categoria: number,
  categorias: CategorySummaryItem[]
}
