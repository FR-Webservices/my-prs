<template>
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    :width="width"
    :height="height"
  >
    <rect x="2" y="4" width="12" height="7" rx="3" :fill="color" />
    <polygon points="7,11 8,13 9,11" :fill="color" />
    <rect x="5" y="7" width="6" height="1.5" rx="0.75" fill="white"/>
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps({
  ...iconProps,
  color: { type: String, default: '#3b82f6' } // blue-500
});
</script>
