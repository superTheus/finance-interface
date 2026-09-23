<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = withDefaults(defineProps<{
  name: string;
  photo?: string | null;
  large?: boolean;
}>(), { photo: null, large: false });

const imageFailed = ref(false);
watch(() => props.photo, () => { imageFailed.value = false; });

const imageUrl = computed(() => {
  if (!props.photo) return '';
  if (/^https?:\/\//i.test(props.photo)) return props.photo;
  const base = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  return `${base}/${props.photo.replace(/^\/+/, '')}`;
});
const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || '?').toUpperCase();
});
</script>

<template>
  <span :class="['user-avatar', { large }]" aria-hidden="true">
    <img v-if="imageUrl && !imageFailed" :src="imageUrl" alt="" @error="imageFailed = true" />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<style scoped lang="scss">
.user-avatar {
  display: inline-grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--orbit-purple), transparent 45%);
  border-radius: 50%;
  background: color-mix(in srgb, var(--orbit-purple), var(--app-surface) 72%);
  color: var(--app-text);
  font-size: 0.84rem;
  font-weight: 800;
}

.user-avatar.large {
  width: 6.5rem;
  height: 6.5rem;
  font-size: 2rem;
}

img { display: block; width: 100%; height: 100%; object-fit: cover; }
</style>
