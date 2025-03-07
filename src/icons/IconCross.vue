<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" :width="width" :height="height">
    <path d="M.293.293a1 1 0 011.414.0L8 6.586 14.293.293a1 1 0 111.414 1.414L9.414 8l6.293 6.293a1 1 0 01-1.414 1.414L8 9.414l-6.293 6.293A1 1 0 01.293 14.293L6.586 8 .293 1.707a1 1 0 010-1.414z"></path>
  </svg>
</template>

<script setup lang="ts">
import { iconProps } from "@/icons/utils";
defineProps(iconProps);
</script>

<style scoped></style>
