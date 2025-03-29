<template>
  <nav class="mb-7 flex items-center">
    <div class="flex items-center justify-between">
      <router-link to="/" class="flex item-center space-x-3">
        <IconMergeable height="32" width="32" color="url(#ci)" />
        <span class="self-center text-2xl font-semibold whitespace-nowrap">My PRs</span>
      </router-link>
    </div>

    <div class="flex ml-auto space-x-2" v-if="!isLoading">
      <button class="border border-text px-2 py-1 rounded cursor-pointer disabled:cursor-wait" @click="fetchPullRequests" :disabled="isLoadingPullRequests">Refresh <span v-show="isLoadingPullRequests">(loading)</span></button>
      <select class="border border-text p-1 rounded cursor-pointer" @change="setInterval(($event.target as HTMLSelectElement).value)">
        <option v-for="timing in refreshTimings" :key="timing.key" :value="timing.value" :selected="getInterval() == timing.value">{{ timing.key }}</option>
      </select>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { isLoadingPullRequests, useGitHub } from '@/composables/useGithub';
import IconMergeable from '@/icons/IconMergeable.vue'
import { refreshTimings } from '@/models/RefreshTiming';

const { fetchPullRequests, setInterval, getInterval } = useGitHub();

defineProps<{ isLoading: boolean }>();
</script>

<style scoped></style>
