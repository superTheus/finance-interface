<script setup lang="ts">
import { Api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import type { KanbanCard, KanbanCardWithTasks, Tarefas } from '@/types/types'
import { useConfirm, useToast } from 'primevue'
import moment from 'moment'
import { computed, onMounted, ref } from 'vue'

type TaskForm = {
  id?: number
  id_card: number
  titulo: string
  descricao: string
  data_vencimento: Date
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

const isEditingCard = computed(() => !!cardForm.value.id)
const isEditingTask = computed(() => !!taskForm.value.id)

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
    message: `Deseja deletar o card \"${card.titulo}\"?`,
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
    message: `Deseja deletar a tarefa \"${task.titulo}\"?`,
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
      <Button label="Novo card" icon="pi pi-plus" @click="openCreateCardDialog" />
    </div>

    <div class="kanban-board" v-if="!loading">
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
            <div class="task-description">{{ task.descricao }}</div>
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
      :style="{ width: '32rem' }"
    >
      <div class="dialog-form">
        <FloatLabel variant="on">
          <InputText id="task-title" v-model="taskForm.titulo" fluid />
          <label for="task-title">Título</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <Textarea id="task-description" v-model="taskForm.descricao" rows="4" fluid />
          <label for="task-description">Descrição</label>
        </FloatLabel>

        <div>
          <label class="input-label">Data de vencimento</label>
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
.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.kanban-board {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kanban-column {
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
  font-size: 0.9rem;
  color: var(--p-text-muted-color);
  margin-bottom: 0.5rem;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
