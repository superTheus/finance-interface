<script setup lang="ts">
import { Api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import type { KanbanCard, KanbanCardWithTasks, Tarefas } from '@/types/types'
import { useConfirm, useToast } from 'primevue'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'
import VMdEditor from '@kangc/v-md-editor'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import enUS from '@kangc/v-md-editor/lib/lang/en-US'
import hljs from 'highlight.js'
import '@kangc/v-md-editor/lib/style/base-editor.css'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import '@kangc/v-md-editor/lib/style/preview.css'

VMdEditor.use(githubTheme, {
  Hljs: hljs,
})
VMdEditor.lang.use('en-US', enUS)
VMdPreview.use(githubTheme, {
  Hljs: hljs,
})
VMdPreview.lang.use('en-US', enUS)

type TaskForm = {
  id?: number
  id_card: number
  titulo: string
  descricao: string
  data_vencimento: Date
}

type ViewMode = 'kanban' | 'lista'

type ListTask = Tarefas & {
  cardTitulo: string
}

const api = new Api()
const user = useUserStore()
const confirm = useConfirm()
const toast = useToast()

const cards = ref<KanbanCardWithTasks[]>([])
const loading = ref(false)

const showCardDialog = ref(false)
const cardForm = ref<{ id?: number; titulo: string }>({ titulo: '' })

const showTaskDialog = ref(false)
const taskForm = ref<TaskForm>({
  id_card: 0,
  titulo: '',
  descricao: '',
  data_vencimento: new Date(),
})

const viewMode = ref<ViewMode>('kanban')
const viewModeOptions = ref([
  { label: 'Kanban', value: 'kanban' },
  { label: 'Listagem', value: 'lista' },
])

const isEditingCard = computed(() => !!cardForm.value.id)
const isEditingTask = computed(() => !!taskForm.value.id)

const listTasks = computed<ListTask[]>(() =>
  cards.value.flatMap((card) =>
    (card.tarefas || []).map((task) => ({
      ...task,
      cardTitulo: card.titulo,
    })),
  ),
)

async function handleUploadImage(
  _event: ClipboardEvent | DragEvent,
  insertImage: (options: { url: string; desc?: string }) => void,
  files: File[],
) {
  const file = files?.[0]

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.add({
      severity: 'warn',
      summary: 'Arquivo inválido',
      detail: 'Cole ou envie apenas imagens',
      life: 3000,
    })
    return
  }

  const fileReader = new FileReader()

  fileReader.onload = () => {
    insertImage({
      url: String(fileReader.result || ''),
      desc: file.name,
    })
  }

  fileReader.readAsDataURL(file)
}

async function loadCards() {
  if (!user.user?.id) return

  loading.value = true
  try {
    const response = await api.kanbanCard.listar({
      filter: {
        id_usuario: user.user.id,
        deletado: 'N',
      },
      includes: {
        tarefas: true,
      },
      order: {
        cols: ['ordem'],
        direction: 'ASC',
      },
    })

    cards.value = response.data
      .filter((card) => card.deletado === 'N')
      .sort((a, b) => a.ordem - b.ordem)
      .map((card) => ({
        ...card,
        tarefas: (card.tarefas || []).filter((task) => task.deletado === 'N'),
      }))
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível carregar os cards',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

function openCreateCardDialog() {
  cardForm.value = { titulo: '' }
  showCardDialog.value = true
}

function openEditCardDialog(card: KanbanCard) {
  cardForm.value = { id: card.id, titulo: card.titulo }
  showCardDialog.value = true
}

async function saveCard() {
  if (!user.user?.id || !cardForm.value.titulo.trim()) return

  try {
    if (isEditingCard.value && cardForm.value.id) {
      await api.kanbanCard.atualizar(cardForm.value.id, {
        titulo: cardForm.value.titulo,
      })
    } else {
      await api.kanbanCard.criar({
        id_usuario: user.user.id,
        titulo: cardForm.value.titulo,
        ordem: cards.value.length + 1,
        deletado: 'N',
      })
    }

    showCardDialog.value = false
    await loadCards()
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível salvar o card',
      life: 3000,
    })
  }
}

function confirmDeleteCard(card: KanbanCard) {
  confirm.require({
    message: `Deseja deletar o card "${card.titulo}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancelar',
      outlined: true,
      severity: 'secondary',
    },
    acceptProps: {
      label: 'Deletar',
      severity: 'danger',
    },
    accept: async () => {
      if (!card.id) return

      try {
        await api.kanbanCard.atualizar(card.id, {
          deletado: 'S',
        })

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Card deletado com sucesso',
          life: 3000,
        })

        await loadCards()
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível deletar o card',
          life: 3000,
        })
      }
    },
  })
}

function openCreateTaskDialog(card: KanbanCard) {
  if (!card.id) return

  taskForm.value = {
    id_card: card.id,
    titulo: '',
    descricao: '',
    data_vencimento: new Date(),
  }

  showTaskDialog.value = true
}

function openEditTaskDialog(task: Tarefas) {
  taskForm.value = {
    id: task.id,
    id_card: task.id_card,
    titulo: task.titulo,
    descricao: task.descricao,
    data_vencimento: moment(task.data_vencimento).toDate(),
  }

  showTaskDialog.value = true
}

async function saveTask() {
  if (!user.user?.id || !taskForm.value.id_card || !taskForm.value.titulo.trim()) return

  const data = {
    id_usuario: user.user.id,
    id_card: taskForm.value.id_card,
    titulo: taskForm.value.titulo,
    descricao: taskForm.value.descricao,
    data_vencimento: moment(taskForm.value.data_vencimento).format('YYYY-MM-DD'),
    deletado: 'N' as const,
  }

  try {
    if (isEditingTask.value && taskForm.value.id) {
      await api.tarefas.atualizar(taskForm.value.id, data)
    } else {
      await api.tarefas.criar(data as Tarefas)
    }

    showTaskDialog.value = false
    await loadCards()
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível salvar a tarefa',
      life: 3000,
    })
  }
}

function confirmDeleteTask(task: Tarefas) {
  confirm.require({
    message: `Deseja deletar a tarefa "${task.titulo}"?`,
    header: 'Confirmar exclusão',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancelar',
      outlined: true,
      severity: 'secondary',
    },
    acceptProps: {
      label: 'Deletar',
      severity: 'danger',
    },
    accept: async () => {
      if (!task.id) return

      try {
        await api.tarefas.atualizar(task.id, {
          deletado: 'S',
        })

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Tarefa deletada com sucesso',
          life: 3000,
        })

        await loadCards()
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível deletar a tarefa',
          life: 3000,
        })
      }
    },
  })
}

function onTaskDragStart(event: DragEvent, task: Tarefas) {
  if (!event.dataTransfer || !task.id) return

  event.dataTransfer.setData('taskId', String(task.id))
  event.dataTransfer.setData('sourceCardId', String(task.id_card))
}

function onColumnDrop(event: DragEvent, targetCard: KanbanCard) {
  event.preventDefault()

  const taskId = Number(event.dataTransfer?.getData('taskId'))
  const sourceCardId = Number(event.dataTransfer?.getData('sourceCardId'))

  if (!taskId || !targetCard.id || sourceCardId === targetCard.id) return

  api.tarefas
    .atualizar(taskId, { id_card: targetCard.id })
    .then(loadCards)
    .catch(() => {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Não foi possível mover a tarefa',
        life: 3000,
      })
    })
}

onMounted(loadCards)
</script>

<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <h2>Kanban</h2>
      <div class="header-actions">
        <SelectButton
          v-model="viewMode"
          :options="viewModeOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
        />
        <Button label="Novo card" icon="pi pi-plus" @click="openCreateCardDialog" />
      </div>
    </div>

    <div v-if="!loading && viewMode === 'kanban'" class="kanban-board">
      <div
        v-for="card in cards"
        :key="card.id"
        class="kanban-column"
        @dragover.prevent
        @drop="(event) => onColumnDrop(event, card)"
      >
        <div class="column-header">
          <h3>{{ card.titulo }}</h3>
          <div class="actions">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              @click="openEditCardDialog(card)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              @click="confirmDeleteCard(card)"
            />
          </div>
        </div>

        <Button
          class="add-task"
          label="Nova tarefa"
          icon="pi pi-plus"
          size="small"
          outlined
          @click="openCreateTaskDialog(card)"
        />

        <div class="tasks-list">
          <div
            v-for="task in card.tarefas"
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="(event) => onTaskDragStart(event, task)"
          >
            <div class="task-title">{{ task.titulo }}</div>
            <div class="task-description markdown-preview-wrapper">
              <VMdPreview :text="task.descricao || ''" />
            </div>
            <div class="task-footer">
              <small>Vence: {{ moment(task.data_vencimento).format('DD/MM/YYYY') }}</small>
              <div class="actions">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  size="small"
                  @click="openEditTaskDialog(task)"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmDeleteTask(task)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="list-view">
      <DataTable :value="listTasks" stripedRows tableStyle="min-width: 60rem">
        <Column field="titulo" header="Tarefa" />
        <Column field="cardTitulo" header="Card" />
        <Column header="Descrição">
          <template #body="slotProps">
            <div class="markdown-preview-wrapper">
              <VMdPreview :text="slotProps.data.descricao || ''" />
            </div>
          </template>
        </Column>
        <Column header="Vencimento">
          <template #body="slotProps">
            {{ moment(slotProps.data.data_vencimento).format('DD/MM/YYYY') }}
          </template>
        </Column>
        <Column header="Ações" style="width: 8rem">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              severity="secondary"
              text
              rounded
              size="small"
              @click="openEditTaskDialog(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              rounded
              size="small"
              @click="confirmDeleteTask(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog
      v-model:visible="showCardDialog"
      :header="isEditingCard ? 'Editar card' : 'Novo card'"
      modal
      :style="{ width: '28rem' }"
    >
      <div class="dialog-form">
        <FloatLabel variant="on">
          <InputText id="card-title" v-model="cardForm.titulo" fluid />
          <label for="card-title">Título</label>
        </FloatLabel>

        <div class="dialog-actions">
          <Button label="Cancelar" severity="secondary" outlined @click="showCardDialog = false" />
          <Button label="Salvar" @click="saveCard" />
        </div>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="showTaskDialog"
      :header="isEditingTask ? 'Editar tarefa' : 'Nova tarefa'"
      modal
      :style="{ width: '58rem' }"
    >
      <div class="dialog-form">
        <FloatLabel variant="on">
          <InputText id="task-title" v-model="taskForm.titulo" fluid />
          <label for="task-title">Título</label>
        </FloatLabel>

        <div class="editor-wrapper">
          <VMdEditor
            v-model="taskForm.descricao"
            height="340px"
            left-toolbar="undo redo clear | h bold italic strikethrough quote | ul ol table hr | link image code"
            right-toolbar="preview toc sync-scroll fullscreen"
            @upload-image="handleUploadImage"
          />
        </div>

        <div>
          <label class="input-label">Data Previsão Conclusão</label>
          <DatePicker v-model="taskForm.data_vencimento" dateFormat="dd/mm/yy" fluid />
        </div>

        <div class="dialog-actions">
          <Button label="Cancelar" severity="secondary" outlined @click="showTaskDialog = false" />
          <Button label="Salvar" @click="saveTask" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.kanban-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kanban-board {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 320px;
  background: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 10px;
  padding: 1rem;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.column-header h3 {
  margin: 0;
}

.add-task {
  width: 100%;
  margin-bottom: 0.8rem;
}

.tasks-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.75rem;
}

.task-card {
  padding: 0.75rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
  background: var(--p-surface-0);
  cursor: grab;
}

.task-title {
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.task-description {
  margin-bottom: 0.5rem;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-view {
  width: 100%;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.input-label {
  display: block;
  margin-bottom: 0.35rem;
}

.editor-wrapper :deep(.v-md-editor) {
  border-radius: 8px;
  overflow: hidden;
}

.markdown-preview-wrapper :deep(.v-md-editor-preview) {
  padding: 0;
}

.markdown-preview-wrapper :deep(.v-md-editor-preview img) {
  max-width: 100%;
  height: auto;
}
</style>
