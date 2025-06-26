import { Octokit } from 'octokit'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { githubPatKey, pullRequestsKey, refreshIntervalKey } from '@/localStorageKeys'
import type {
  PullRequestLocalStorage,
  PullRequest,
  GraphQLViewerResult,
  GraphQLResult,
} from '@/models/PullRequest'
import { ReviewStatus } from '@/models/PullRequest'
import { initialDefaultTiming, noUpdateTiming } from '@/models/RefreshTiming'
import { CronJob, CronTime } from 'cron'
import {PULL_REQUESTS_QUERY} from '@/composables/graphql-queries/pull-request'

export const isLoadingPullRequests = ref(false)

const pat = useStorage(githubPatKey, '')
const username = ref('')
const initialized = ref(false)
const refreshIntervalTime = useStorage<string>(refreshIntervalKey, initialDefaultTiming)
const pullRequest = useStorage<PullRequestLocalStorage>(pullRequestsKey, {})

let refreshCronJob: CronJob
let octokit: Octokit

interface UseGitHubReturn {
  fetchPullRequests: () => void
  getPullRequests: () => PullRequest[]
  setInterval: (interval: string) => void
  getInterval: () => string
  init: () => Promise<void>
}

export function useGitHub(): UseGitHubReturn {
  const askForPat = (): string => {
    let patPrompt: string | null
    while (true) {
      patPrompt = prompt(
        'Please enter your personal access token from GitHub. It should have at least the "repo" scope enabled to get also access to private repositories',
        '',
      )
      if (!patPrompt?.match(/^(gh[ps]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})$/)) {
        alert("You haven't entered a valid token! Please try again.")
      }
      break
    }
    return patPrompt!
  }

  const fetchViewerLogin = async (): Promise<string> => {
    const query = `query { viewer { login } }`
    try {
      const result: GraphQLViewerResult = await octokit.graphql<GraphQLViewerResult>(query)
      return result.viewer.login
    } catch {
      throw new Error('Failed to fetch viewer login')
    }
  }
  const fetchPullRequests = async (): Promise<void> => {
    console.log('fetchPullRequests: start (GraphQL)')
    isLoadingPullRequests.value = true
    try {
      // Get username if not set
      if (!username.value) {
        username.value = await fetchViewerLogin()
      }
      // GraphQL query for PRs involving the user
      let hasNextPage = true
      let after: string | null = null
      const allPRs: PullRequest[] = []

      while (hasNextPage) {
        const result: GraphQLResult = await octokit.graphql<GraphQLResult>(PULL_REQUESTS_QUERY, { after, author: username.value })
        const { nodes, pageInfo } = result.search

        for (const pr of nodes) {
          if (typeof pr.isDraft === 'undefined') continue
          let reviewStatus: ReviewStatus = ReviewStatus.NotReviewed
          const latestReview = pr.reviews.nodes.length > 0 ? pr.reviews.nodes[pr.reviews.nodes.length - 1] : null

          if (latestReview) {
            if (Object.values(ReviewStatus).includes(latestReview.state as ReviewStatus)) {
              reviewStatus = latestReview.state as ReviewStatus
            } else {
              reviewStatus = ReviewStatus.NotReviewed
            }
          } else if (pr.reviewRequests.nodes.some((n) => n.requestedReviewer?.login === username.value)) {
            reviewStatus = ReviewStatus.Pending
          }

          allPRs.push({
            id: pr.id,
            number: pr.number,
            title: pr.title,
            updated_at: pr.updatedAt,
            html_url: pr.url,
            repository_url: pr.repository.owner.login + '/' + pr.repository.name,
            draft: pr.isDraft,
            reviewStatus,
            labels: pr.labels.nodes,
          })
        }

        hasNextPage = pageInfo.hasNextPage
        after = pageInfo.endCursor
      }

      pullRequest.value = {}

      for (const pr of allPRs) {
        pullRequest.value[pr.number] = pr
      }
    } catch (err) {
      // TODO: present error to user
      throw err
    } finally {
      isLoadingPullRequests.value = false
    }
  }

  const getPullRequests = (): PullRequest[] => {
    return Object.values<PullRequest>(pullRequest.value).sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    )
  }

  const setInterval = (intervalInput: string): void => {
    console.log('setInterval', intervalInput)
    refreshIntervalTime.value = intervalInput
    refreshCronJob.stop()
    if (refreshIntervalTime.value == noUpdateTiming) {
      return
    }
    refreshCronJob.setTime(new CronTime(refreshIntervalTime.value))
    refreshCronJob.start()
  }

  const getInterval = (): string => {
    console.log('getInterval', refreshIntervalTime.value)
    return refreshIntervalTime.value
  }

  const init = async (): Promise<void> => {
    if (initialized.value) return
    if (pat.value.length == 0) {
      pat.value = askForPat()
    }
    octokit = new Octokit({
      auth: pat.value,
      userAgent: 'my-prs/v0.0.0',
      previews: ['shadow-cat'],
    })
    username.value = await fetchViewerLogin()
    refreshCronJob = new CronJob(initialDefaultTiming, fetchPullRequests)
    if (Object.keys(pullRequest.value).length == 0) {
      await fetchPullRequests()
    }
    refreshCronJob.start()
    initialized.value = true
  }

  return {
    getPullRequests,
    fetchPullRequests,
    setInterval,
    getInterval,
    init,
  }
}

export function extractGitHubRepoFromUrl(url: string): { owner: string; name: string } {
  const match = url.match(/github\.com\/(?:repos\/)?(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
  if (!match || !(match.groups?.owner && match.groups?.name)) return { name: '', owner: '' }
  return {
    name: match.groups.name,
    owner: match.groups.owner,
  }
}
