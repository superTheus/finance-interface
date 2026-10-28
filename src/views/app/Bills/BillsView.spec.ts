import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import moment from 'moment';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import SplitButton from 'primevue/splitbutton';
import type { MenuItem } from 'primevue/menuitem';
import type { Bills } from '@/types/types';
import definePrimeVue from '@/plugins/prime';
import BillsView from './BillsView.vue';

const mocks = vi.hoisted(() => ({
  findBills: vi.fn(), resumes: vi.fn(), payments: vi.fn(), findBankAccounts: vi.fn(),
  findCategories: vi.fn(), listCreditCards: vi.fn(), updateBills: vi.fn(), toast: vi.fn(),
}));
vi.mock('@/services/api', () => ({ Api: class {
  findBills = mocks.findBills;
  resumes = mocks.resumes;
  payments = mocks.payments;
  findBankAccounts = mocks.findBankAccounts;
  findCategories = mocks.findCategories;
  listCreditCards = mocks.listCreditCards;
  updateBills = mocks.updateBills;
} }));
vi.mock('@/stores/user', () => ({ useUserStore: () => ({ user: { id: 1 } }) }));
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toast }) }));
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => ({ require: vi.fn() }) }));

let wrapper: VueWrapper;
let invoice: Bills;

beforeEach(() => {
  vi.clearAllMocks();
  invoice = {
    id: 10, id_usuario: 1, titulo: 'Fatura principal', valor: '100.00' as unknown as number,
    tipo: 'D', status: 'PE', vencimento: moment().format('YYYY-MM-DD'), descricao: '',
    origem_cartao: 'fatura', id_cartao_credito: 3, ciclo_fatura: moment().format('YYYY-MM'),
  };
  mocks.findBills.mockResolvedValue({ total: 1, data: [invoice] });
  mocks.resumes.mockResolvedValue({ saldo: 0, totalPagar: 100, totalReceber: 0, totalFaltaPagar: 100, totalFaltaReceber: 0 });
  mocks.payments.mockResolvedValue([{ id: 1, descricao: 'PIX' }, { id: 2, descricao: 'CARTÃO DE CRÉDITO' }]);
  mocks.findBankAccounts.mockResolvedValue({ data: [] });
  mocks.findCategories.mockResolvedValue({ data: [] });
  mocks.listCreditCards.mockResolvedValue([{ id: 3, nome: 'Principal', limite_parcelas: 12 }]);
  mocks.updateBills.mockResolvedValue(invoice);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});

afterEach(async () => {
  wrapper?.unmount();
  await flushPromises();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

async function openInvoice() {
  wrapper = mount(BillsView, {
    attachTo: document.body,
    global: { plugins: [definePrimeVue], stubs: { ModalFilters: true, ValuesTotals: true, teleport: true } },
  });
  await flushPromises();
  const menu = wrapper.findComponent(SplitButton).props('model') as MenuItem[];
  expect(menu.some((item) => item.label === 'Excluir')).toBe(false);
  const edit = menu.find((item) => item.label === 'Editar');
  expect(edit).toBeDefined();
  edit!.command!({ originalEvent: new Event('click'), item: edit! });
  await flushPromises();
  return wrapper.findAllComponents(Dialog).find((dialog) => dialog.props('header') === 'Editar conta')!;
}

describe('editing a credit card invoice account', () => {
  it('opens the editor and saves title, amount and due date using the existing account endpoint', async () => {
    const dialog = await openInvoice();
    expect(dialog.findAllComponents(Select)[0].props('disabled')).toBe(true);
    const paymentSelect = dialog.findAllComponents(Select).find((select) => select.props('inputId') === 'forma-pagamento-edicao')!;
    expect(paymentSelect.props('options')).toEqual([{ id: 1, descricao: 'PIX' }]);
    await dialog.find('#titulo').setValue('Fatura ajustada');
    dialog.findComponent(InputNumber).vm.$emit('update:modelValue', 175.50);
    dialog.findComponent(DatePicker).vm.$emit('update:modelValue', new Date(2031, 1, 3));
    await dialog.find('form').trigger('submit');
    await flushPromises();
    expect(mocks.updateBills).toHaveBeenCalledWith(10, {
      titulo: 'Fatura ajustada', tipo: 'D', valor: 175.50, vencimento: '2031-02-03',
      descricao: '', id_categoria: null, id_forma_pagamento: null,
    });
    expect(dialog.props('visible')).toBe(false);
    expect(mocks.findBills).toHaveBeenCalledTimes(2);
    expect(mocks.resumes).toHaveBeenCalledTimes(2);
  });

  it('accepts an unchanged decimal value returned as a string by the API', async () => {
    const dialog = await openInvoice();
    await dialog.find('form').trigger('submit');
    await flushPromises();
    expect(mocks.updateBills).toHaveBeenCalledWith(10, expect.objectContaining({ valor: 100 }));
  });

  it('rejects an invalid amount before sending and keeps the editor open', async () => {
    const dialog = await openInvoice();
    dialog.findComponent(InputNumber).vm.$emit('update:modelValue', 0);
    await dialog.find('form').trigger('submit');
    await flushPromises();
    expect(mocks.updateBills).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    expect(dialog.props('visible')).toBe(true);
  });

  it('keeps edited data available when the API rejects the update', async () => {
    mocks.updateBills.mockRejectedValueOnce({ message: 'Vencimento inválido' });
    invoice.status = 'PA';
    const dialog = await openInvoice();
    await dialog.find('#titulo').setValue('Fatura paga revisada');
    await dialog.find('form').trigger('submit');
    await flushPromises();
    expect(mocks.updateBills).toHaveBeenCalledWith(10, expect.objectContaining({ titulo: 'Fatura paga revisada' }));
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ detail: 'Vencimento inválido' }));
    expect(dialog.props('visible')).toBe(true);
    expect((dialog.find('#titulo').element as HTMLInputElement).value).toBe('Fatura paga revisada');
  });
});
