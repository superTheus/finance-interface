import Aura from '@primevue/themes/aura';
import { Badge, Button, Card, Carousel, Checkbox, Chip, Column, ConfirmationService, ConfirmDialog, DataTable, DatePicker, Dialog, DialogService, Divider, Drawer, FloatLabel, InputGroup, InputGroupAddon, InputMask, InputNumber, InputText, Paginator, RadioButton, Select, SelectButton, SplitButton, Step, StepItem, StepList, StepPanel, StepPanels, Stepper, Textarea, TieredMenu, ToastService, ToggleSwitch, Tooltip } from 'primevue';
import Chart from 'primevue/chart';
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
  Select, RadioButton, SplitButton, Paginator, Chip, Carousel, Chart, InputMask, InputNumber,
  Checkbox, Stepper, StepPanels, StepList, StepItem, Step, StepPanel, FloatLabel, Textarea, ConfirmDialog, Divider
];
const services = [DialogService, ToastService, ConfirmationService];
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
