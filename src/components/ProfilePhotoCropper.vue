<script setup lang="ts">
import { CROP_SIZE, cropLayout } from '@/services/profilePhotoCrop';
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  file: File | null;
  visible: boolean;
  uploading: boolean;
}>();
const emit = defineEmits<{
  cancel: [];
  save: [file: File];
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
const loading = ref(false);
const processing = ref(false);
const error = ref('');
const zoom = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const dragging = ref<{ pointerId: number; x: number; y: number; offsetX: number; offsetY: number } | null>(null);

watch([() => props.file, () => props.visible], async ([file, visible], _previous, onCleanup) => {
  image.value = null;
  error.value = '';
  dragging.value = null;
  if (!file || !visible) {
    loading.value = false;
    return;
  }

  loading.value = true;
  const objectUrl = URL.createObjectURL(file);
  let cancelled = false;
  onCleanup(() => {
    cancelled = true;
    URL.revokeObjectURL(objectUrl);
  });

  try {
    const loaded = new Image();
    await new Promise<void>((resolve, reject) => {
      loaded.onload = () => resolve();
      loaded.onerror = () => reject(new Error('Não foi possível abrir a imagem.'));
      loaded.src = objectUrl;
    });
    if (cancelled) return;
    if (!loaded.naturalWidth || !loaded.naturalHeight) throw new Error('A imagem selecionada é inválida.');
    image.value = loaded;
    zoom.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
    await nextTick();
    drawPreview();
  } catch (cause) {
    if (!cancelled) error.value = cause instanceof Error ? cause.message : 'Não foi possível abrir a imagem.';
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });

watch([canvas, image, zoom, offsetX, offsetY], drawPreview, { flush: 'post' });

function drawPreview(): void {
  const context = canvas.value?.getContext('2d');
  if (!context || !image.value) return;
  const layout = cropLayout(image.value.naturalWidth, image.value.naturalHeight, zoom.value, offsetX.value, offsetY.value);
  context.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
  context.drawImage(image.value, layout.x, layout.y, layout.width, layout.height);
}

function moveImage(x: number, y: number): void {
  if (!image.value) return;
  const layout = cropLayout(image.value.naturalWidth, image.value.naturalHeight, zoom.value, x, y);
  offsetX.value = layout.offsetX;
  offsetY.value = layout.offsetY;
}

function startDrag(event: PointerEvent): void {
  if (!image.value || props.uploading || processing.value) return;
  const target = event.currentTarget as HTMLCanvasElement;
  target.setPointerCapture(event.pointerId);
  dragging.value = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, offsetX: offsetX.value, offsetY: offsetY.value };
}

function drag(event: PointerEvent): void {
  if (!dragging.value || dragging.value.pointerId !== event.pointerId || !canvas.value) return;
  const bounds = canvas.value.getBoundingClientRect();
  moveImage(
    dragging.value.offsetX + (event.clientX - dragging.value.x) * CROP_SIZE / bounds.width,
    dragging.value.offsetY + (event.clientY - dragging.value.y) * CROP_SIZE / bounds.height,
  );
}

function stopDrag(event: PointerEvent): void {
  if (dragging.value?.pointerId === event.pointerId) dragging.value = null;
}

function moveWithKeyboard(event: KeyboardEvent): void {
  const step = event.shiftKey ? 20 : 5;
  const directions: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  const direction = directions[event.key];
  if (!direction || props.uploading) return;
  event.preventDefault();
  moveImage(offsetX.value + direction[0], offsetY.value + direction[1]);
}

async function save(): Promise<void> {
  if (!image.value || !props.file || props.uploading || processing.value) return;
  processing.value = true;
  error.value = '';
  try {
    const output = document.createElement('canvas');
    output.width = 512;
    output.height = 512;
    const context = output.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar o recorte.');
    const layout = cropLayout(image.value.naturalWidth, image.value.naturalHeight, zoom.value, offsetX.value, offsetY.value);
    const ratio = output.width / CROP_SIZE;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(image.value, layout.x * ratio, layout.y * ratio, layout.width * ratio, layout.height * ratio);
    const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) throw new Error('Não foi possível gerar a foto recortada.');
    emit('save', new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' }));
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Não foi possível recortar a foto.';
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <Dialog :visible="visible" modal header="Ajustar foto de perfil" class="profile-crop-dialog"
    :closable="!uploading" :dismissable-mask="!uploading" :close-on-escape="!uploading"
    @update:visible="value => { if (!value && !uploading) emit('cancel'); }">
    <div class="crop-content">
      <p>Arraste a imagem para posicionar seu rosto dentro do círculo.</p>
      <div class="crop-frame" :class="{ 'is-dragging': dragging }">
        <canvas ref="canvas" :width="CROP_SIZE" :height="CROP_SIZE" tabindex="0"
          aria-label="Área de recorte da foto. Arraste ou use as setas para posicionar a imagem."
          @pointerdown="startDrag" @pointermove="drag" @pointerup="stopDrag"
          @pointercancel="stopDrag" @keydown="moveWithKeyboard" />
        <div class="crop-guide" aria-hidden="true"></div>
        <div v-if="loading" class="crop-status">Carregando imagem...</div>
        <div v-else-if="error && !image" class="crop-status">{{ error }}</div>
      </div>
      <label for="profile-photo-zoom">Zoom</label>
      <input id="profile-photo-zoom" v-model.number="zoom" type="range" min="1" max="3" step="0.01"
        :disabled="!image || uploading || processing" aria-label="Zoom da foto" />
      <small>A foto será salva em formato quadrado; no perfil, ela aparece em um círculo.</small>
      <p v-if="error && image" class="crop-error" role="alert">{{ error }}</p>
    </div>
    <template #footer>
      <Button label="Cancelar" severity="secondary" :disabled="uploading || processing" @click="emit('cancel')" />
      <Button label="Salvar foto" icon="pi pi-check" :loading="uploading || processing"
        :disabled="!image || loading || uploading || processing" @click="save" />
    </template>
  </Dialog>
</template>

<style scoped lang="scss">
.crop-content { display: grid; gap: .8rem; }
.crop-content p { margin: 0; color: var(--app-text-muted); }
.crop-content label { font-weight: 600; }
.crop-content small { color: var(--app-text-muted); }
.crop-content input[type='range'] { width: 100%; accent-color: var(--orbit-purple); }
.crop-frame { position: relative; width: min(100%, 360px); aspect-ratio: 1; margin: 0 auto; overflow: hidden; border-radius: .6rem; background: var(--app-surface-soft); cursor: grab; }
.crop-frame.is-dragging { cursor: grabbing; }
.crop-frame canvas { display: block; width: 100%; height: 100%; touch-action: none; outline-offset: -3px; }
.crop-guide { position: absolute; inset: 0; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 180px rgb(0 0 0 / 40%); pointer-events: none; }
.crop-status { position: absolute; inset: 0; display: grid; place-items: center; padding: 1rem; text-align: center; background: var(--app-surface-soft); }
.crop-error { color: #c24141 !important; }
</style>

<style lang="scss">
.profile-crop-dialog { width: min(95vw, 32rem); }
</style>
