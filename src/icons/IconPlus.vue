<template>
  <svg
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    :width="width"
    :height="height"
  >
    <path
      :fill="color"
      d="M9 3.5a.75.75 0 00-1.5 0V7H4a.75.75 0 000 1.5h3.5V12A.75.75 0 009 12V8.5h3.5a.75.75 0 000-1.5H9V3.5z"
    />
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps(iconProps);
</script>

<style scoped></style>
