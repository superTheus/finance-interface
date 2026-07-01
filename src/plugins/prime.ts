import Aura from '@primevue/themes/aura';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Carousel from 'primevue/carousel';
import Chart from 'primevue/chart';
import Checkbox from 'primevue/checkbox';
import Chip from 'primevue/chip';
import Column from 'primevue/column';
import ConfirmationService from 'primevue/confirmationservice';
import ConfirmDialog from 'primevue/confirmdialog';
import PrimeVue from 'primevue/config';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import DialogService from 'primevue/dialogservice';
import Divider from 'primevue/divider';
import Drawer from 'primevue/drawer';
import FloatLabel from 'primevue/floatlabel';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import SplitButton from 'primevue/splitbutton';
import Step from 'primevue/step';
import StepItem from 'primevue/stepitem';
import StepList from 'primevue/steplist';
import StepPanel from 'primevue/steppanel';
import StepPanels from 'primevue/steppanels';
import Stepper from 'primevue/stepper';
import Textarea from 'primevue/textarea';
import TieredMenu from 'primevue/tieredmenu';
import ToastService from 'primevue/toastservice';
import ToggleSwitch from 'primevue/toggleswitch';
import Tooltip from 'primevue/tooltip';
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
