import BankAccounts from "@/views/app/BankAccounts/BankAccounts.vue";
import BillsView from "@/views/app/Bills/BillsView.vue";
import DashboardView from "@/views/app/Dashboard/DashboardView.vue";

export const Routers = [
  {
    path: '/dashboards',
    name: 'Dashboard',
    component: DashboardView,
    icon: 'pi-chart-bar'
  },
  {
    path: '/bills',
    name: 'Contas',
    component: BillsView,
    icon: 'pi-file',
  },
  {
    path: '/banks',
    name: 'Contas Bancárias',
    component: BankAccounts,
    icon: 'pi-building-columns',
  }
]
