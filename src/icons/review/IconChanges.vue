<template>
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    :width="width"
    :height="height"
  >
    <rect x="2" y="2" width="12" height="12" rx="2" :fill="color" />
    <path d="M8 5v6M5 8h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps({
  ...iconProps,
  color: { type: String, default: '#f87171' } // red-400
});
</script>
