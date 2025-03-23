<template>
  <main>
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th scope="col" class="px-6 py-3">
            Number
          </th>
          <th scope="col" class="px-6 py-3">
            Repository
          </th>
          <th scope="col" class="px-6 py-3">
            Title
          </th>
          <th scope="col" class="px-6 py-3">
            Labels
          </th>
          <th scope="col" class="px-6 py-3">
            Updated
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="pull in getPullRequests()" :key="pull.id" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 cursor-pointer" @click="openWebpage(pull.html_url)">
          <td class="px-6 py-1">
            <div class="inline pr-1">
              <IconDraft v-if="pull.draft" class="inline" />
              <IconMergeable color="green" v-else class="inline" />
            </div>
            #{{ pull.number }}
          </td>
          <td class="px-6">
            {{ getRepoString(pull.html_url) }}
          </td>
          <td class="px-6">
            {{ pull.title }}
          </td>
          <td class="px-6">
            <span v-for="label in pull.labels" :key="label.id" :style="{ background: '#' + label.color, color: invert('#' + label.color, true) }" class="p-1 mr-1 rounded">{{ label.name }}</span>
          </td>
          <td class="px-6">
            <relative-time :datetime="pull.updated_at" format="relative" tense="past">
              Oops! This browser doesn't support Web Components.
            </relative-time>
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script setup lang="ts">
import { useGitHub } from '@/composables/useGithub';
import invert from 'invert-color';
import '@github/relative-time-element';
import IconDraft from '@/icons/IconDraft.vue';
import IconMergeable from '@/icons/IconMergeable.vue';

const { getPullRequests, extractGitHubRepoFromUrl } = useGitHub()

const getRepoString = (url: string): string => {
  const { owner, name } = extractGitHubRepoFromUrl(url)
  return `${owner}/${name}`
}

const openWebpage = (url: string) => {
  window.open(url, '_blank');
}
</script>
