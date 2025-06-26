<template>
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    :width="width"
    :height="height"
  >
    <circle cx="8" cy="8" r="6" :fill="color" />
    <path d="M5 8.5l2 2 4-4" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps({
  ...iconProps,
  color: { type: String, default: '#22c55e' } // green-500
});
</script>
