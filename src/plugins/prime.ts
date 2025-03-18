import Aura from '@primevue/themes/aura';
import { Badge, Button, Card, Chip, Column, DataTable, DatePicker, Dialog, DialogService, Divider, Drawer, InputGroup, InputGroupAddon, InputText, Paginator, RadioButton, Select, SelectButton, SplitButton, TieredMenu, ToastService, ToggleSwitch, Tooltip } from 'primevue';
import PrimeVue from 'primevue/config';
import type { App } from 'vue';

const options = {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
    }
  }
}

const components = [
  Button, InputText, InputGroup, InputGroupAddon, DataTable, Column, Card, Badge,
  DatePicker, Drawer, TieredMenu, Dialog, Divider, ToggleSwitch, SelectButton,
  Select, RadioButton, SplitButton, Paginator, Chip
];
const services = [DialogService, ToastService];
const directives = [{
  name: 'tooltip',
  directive: Tooltip
}];

export default function definePrimeVue(App: App<Element>): void {
  App.use(PrimeVue, options);
  components.forEach((component) => {
    App.component(component.name, component);
  });
  services.forEach((service) => {
    App.use(service);
  });
  directives.forEach((directive) => {
    App.directive(directive.name, directive.directive);
  });
};
