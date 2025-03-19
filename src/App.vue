<template>
  <div class="p-7">
    <header>
      <NavBar />
    </header>

    <Suspense>
      <RouterView />
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue';
</script>

<style scoped></style>
