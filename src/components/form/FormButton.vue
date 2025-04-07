<template>
  <button class="border border-zinc-600 focus:border-amber-400 px-2 py-1 rounded cursor-pointer disabled:cursor-wait" :disabled="disabled">
    {{ label }}
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string
  disabled?: boolean
}

defineProps<Props>();
</script>
