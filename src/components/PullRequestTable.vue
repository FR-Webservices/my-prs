<template>
  <DataTable v-model:filters="filters" v-model:selection="selectedPullRequests" :value="github.getPullRequests()" dataKey="id" filterDisplay="menu" :globalFilterFields="['title', 'user.login', 'body', 'html_url', 'number']" removableSort selectionMode="single" @rowSelect="onRowSelect">

    <template #header>
      <div class="flex justify-between">
        <FormButton @click="clearFilter" label="Clear filter" />

        <IconField>
          <InputText v-model="(filters.global as DataTableFilterMetaData).value" placeholder="Search" />
        </IconField>
      </div>
    </template>

    <template #empty> No pull requests found. </template>
    <template #loading> Loading pull requests. Please wait. </template>

    <Column field="number" header="Number" sortable>
      <template #body="{ data }">
        <PullRequestStatusIcon :draft="data.draft" :reviewStatus="data.reviewStatus" />
        <span class="ml-1">#{{ data.number }}</span>
      </template>
    </Column>

    <Column field="html_url" header="Repository" sortable :filter="true" :filterMatchModeOptions="[{ label: 'Starts with', value: 'filterRepositoriesByStartsWith' }]" :filterFunction="filterRepositoriesByStartsWith">
      <template #body="{ data }">
        {{ getRepoString(data.html_url) }}
      </template>
      <template #filter="{ filterModel }">
        <InputText v-model="filterModel.value" type="text" placeholder="Search by repository" />
      </template>
    </Column>

    <Column field="title" header="Title" sortable></Column>

    <Column field="labels" header="Labels">
      <template #body="{ data }">
        <span v-for="label in data.labels" :key="label.id" :style="{ background: '#' + label.color, color: invert('#' + label.color, true) }" class="p-1 mr-1 rounded">{{ label.name }}</span>
      </template>
    </Column>

    <Column field="updated_at" header="Updated" sortable :filter="true" filterField="updated_at" dataType="updated_at" style="min-width: 10rem">
      <template #body="{ data }">
        <relative-time :datetime="data.updated_at" format="relative" tense="past">
          Oops! This browser doesn't support Web Components.
        </relative-time>
      </template>
    </Column>

  </DataTable>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { FilterService } from '@primevue/core/api'
import type { DataTableFilterMeta, DataTableFilterMetaData, DataTableRowSelectEvent } from 'primevue/datatable'
import { useGitHub, extractGitHubRepoFromUrl } from '@/composables/useGithub'
import invert from 'invert-color'
import FormButton from '@/components/form/FormButton.vue'
import '@github/relative-time-element'
import type { PullRequest } from '@/models/PullRequest'
import { initialFilters } from '@/models/Filters'
import PullRequestStatusIcon from '@/components/PullRequestStatusIcon.vue'

const selectedPullRequests = ref<PullRequest[]>([])
const filters = ref<DataTableFilterMeta>(structuredClone(initialFilters))

// Get the full composable instance
const github = useGitHub()

onMounted(async () => {
  try {
    await github.init()
  } catch (err) {
    // Show error to user
    console.log('GitHub authentication failed.', err)
    alert('GitHub authentication failed. Please check your token.')
  }
})

const getRepoString = (url: string): string => {
  const { owner, name } = extractGitHubRepoFromUrl(url)
  return `${owner}/${name}`
}

const filterRepositoriesByStartsWith = (url: string, value: string): boolean => {
  return getRepoString(url).startsWith(value)
}

const clearFilter = () => {
  filters.value = structuredClone(initialFilters);
  (filters.value.global as DataTableFilterMetaData).value = ''
}

const onRowSelect = (event: DataTableRowSelectEvent<PullRequest>) => {
  window.open(event.data.html_url, '_blank')
}

FilterService.register('filterRepositoriesByStartsWith', filterRepositoriesByStartsWith);
</script>
