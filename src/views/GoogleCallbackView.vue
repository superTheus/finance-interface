<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  window.opener?.postMessage(
    code
      ? { type: 'GOOGLE_AUTH_CODE', code, state: params.get('state') }
      : { type: 'GOOGLE_AUTH_ERROR' },
    window.location.origin,
  );
  window.close();
});
</script>

<template>
  <main>Concluindo login com Google...</main>
</template>
