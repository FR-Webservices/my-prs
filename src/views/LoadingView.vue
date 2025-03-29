<template>
  <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center z-50">
    <IconLoadingSpinner height="100" width="100" />
  </div>
</template>

<script setup lang="ts">
import IconLoadingSpinner from '@/icons/IconLoadingSpinner.vue'
defineProps<{ isLoading: boolean }>();
</script>
