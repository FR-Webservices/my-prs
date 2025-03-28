<template>
  <div class="p-7">
    <header>
      <NavBar :isLoading="isLoading" />
    </header>

    <LoadingScreen :isLoading="isLoading" />
    <Suspense v-if="!isLoading">
      <RouterView />
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import LoadingScreen from "@/views/LoadingView.vue"
import { onMounted, ref } from 'vue';
import { useMigrations } from './migrations/useMigrations';

const isLoading = ref<boolean>(true);

const { isMigrationAvailable, performDataMigration } = useMigrations()

onMounted(async () => {
  if (isMigrationAvailable()) {
    await performDataMigration()
  }

  isLoading.value = false
});

</script>
