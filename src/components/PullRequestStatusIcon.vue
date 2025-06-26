<template>
  <span
    class="relative inline-block"
    style="width: 24px; height: 20px;"
    :title="statusTitle"
  >
    <span v-if="draft" class="absolute left-0 top-0">
      <IconDraft :width="16" :height="16" />
    </span>
    <span v-else class="absolute left-0 top-0">
      <IconMergeable :width="16" :height="16" color="#22c55e" />
    </span>

    <span v-if="reviewStatus === ReviewStatus.Approved" class="absolute right-0 bottom-0">
      <IconReviewApproved :width="12" :height="12" />
    </span>
    <span v-else-if="reviewStatus === ReviewStatus.ChangesRequested" class="absolute right-0 bottom-0">
      <IconReviewChanges :width="12" :height="12" />
    </span>
    <span v-else-if="reviewStatus === ReviewStatus.Commented" class="absolute right-0 bottom-0">
      <IconReviewCommented :width="12" :height="12" />
    </span>
    <span v-else-if="reviewStatus === ReviewStatus.Pending" class="absolute right-0 bottom-0">
      <IconReviewPending :width="12" :height="12" />
    </span>
    <span v-else-if="reviewStatus === ReviewStatus.Dismissed" class="absolute right-0 bottom-0">
      <IconCross :width="12" :height="12" color="#9ca3af" />
    </span>
    <span v-else class="absolute right-0 bottom-0">
      <IconReviewPending :width="12" :height="12" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import IconDraft from '@/icons/IconDraft.vue'
import IconMergeable from '@/icons/IconMergeable.vue'
import IconReviewApproved from '@/icons/review/IconApproved.vue'
import IconReviewChanges from '@/icons/review/IconChanges.vue'
import IconReviewCommented from '@/icons/review/IconCommented.vue'
import IconReviewPending from '@/icons/review/IconPending.vue'
import IconCross from '@/icons/IconCross.vue'
import { ReviewStatus } from '@/models/PullRequest'

const props = defineProps<{ draft: boolean, reviewStatus?: ReviewStatus }>()

const statusTitle = computed(() => {
  const draftLabel = props.draft ? 'Draft PR' : 'Ready for review'
  let reviewLabel = ''
  switch (props.reviewStatus) {
    case ReviewStatus.Approved:
      reviewLabel = 'You approved this PR'
      break
    case ReviewStatus.ChangesRequested:
      reviewLabel = 'You requested changes'
      break
    case ReviewStatus.Commented:
      reviewLabel = 'You commented'
      break
    case ReviewStatus.Pending:
      reviewLabel = 'Your review is pending'
      break
    case ReviewStatus.Dismissed:
      reviewLabel = 'Your dismissed the review'
      break
    default:
      reviewLabel = 'Not reviewed'
  }
  return `${draftLabel} • ${reviewLabel}`
})
</script>
