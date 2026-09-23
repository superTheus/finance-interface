import Aura from '@primevue/themes/aura';
import Badge from 'primevue/badge';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Carousel from 'primevue/carousel';
import Chart from 'primevue/chart';
import Checkbox from 'primevue/checkbox';
import Chip from 'primevue/chip';
import ColorPicker from 'primevue/colorpicker';
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
import Message from 'primevue/message';
import Paginator from 'primevue/paginator';
import RadioButton from 'primevue/radiobutton';
import ProgressSpinner from 'primevue/progressspinner';
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
import Tag from 'primevue/tag';
import TieredMenu from 'primevue/tieredmenu';
import ToastService from 'primevue/toastservice';
import ToggleSwitch from 'primevue/toggleswitch';
import Tooltip from 'primevue/tooltip';
import type { App } from 'vue';

const options = {
  locale: {
    firstDayOfWeek: 0,
    dayNames: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    dayNamesShort: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'],
    dayNamesMin: ['Do', 'Se', 'Te', 'Qa', 'Qi', 'Sx', 'Sa'],
    monthNames: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
    monthNamesShort: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    dateFormat: 'dd/mm/yy',
    today: 'Hoje',
    clear: 'Limpar',
    chooseDate: 'Escolher data',
    chooseMonth: 'Escolher mês',
    chooseYear: 'Escolher ano',
    prevMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    prevYear: 'Ano anterior',
    nextYear: 'Próximo ano',
    prevDecade: 'Década anterior',
    nextDecade: 'Próxima década',
    weekHeader: 'Sem.',
  },
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
  Checkbox, Stepper, StepPanels, StepList, StepItem, Step, StepPanel, FloatLabel, Textarea, ConfirmDialog
  , ColorPicker, Message, ProgressSpinner, Tag
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
