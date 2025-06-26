<template>
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    :width="width"
    :height="height"
  >
    <circle cx="8" cy="8" r="6" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps({
  ...iconProps,
  color: { type: String, default: '#facc15' } // yellow-400
});
</script>
