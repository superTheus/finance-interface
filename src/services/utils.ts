import { useToast } from 'primevue';
import Toast, { type ToastMessageOptions } from 'primevue/toast';

export class Utils {
  public formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
