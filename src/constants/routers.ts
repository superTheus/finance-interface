import BankAccounts from '@/views/app/BankAccounts/BankAccounts.vue';
import BillsView from '@/views/app/Bills/BillsView.vue';
import DashboardView from '@/views/app/Dashboard/DashboardView.vue';
import CategoriesView from '@/views/app/Categories/CategoriesView.vue';
import PurchasePlanView from '@/views/app/PurchasePlan/PurchasePlanView.vue';
import CreditCardsView from '@/views/app/CreditCards/CreditCardsView.vue';

export const Routers = [
  {
    path: 'dashboards',
    name: 'Dashboard',
    component: DashboardView,
    icon: 'pi-chart-line',
  },
  {
    path: 'bills',
    name: 'Contas',
    component: BillsView,
    icon: 'pi-wallet',
  },
  {
    path: 'banks',
    name: 'Contas Bancarias',
    component: BankAccounts,
    icon: 'pi-building-columns',
  },
  {
    path: 'credit-cards',
    name: 'Cartões de crédito',
    component: CreditCardsView,
    icon: 'pi-credit-card',
  },
  {
    path: 'categories',
    name: 'Categorias',
    component: CategoriesView,
    icon: 'pi-tags',
  },
  {
    path: 'purchase-plan',
    name: 'Plano de compras',
    component: PurchasePlanView,
    icon: 'pi-shopping-cart',
  },
];
