import { Octokit } from 'octokit'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { githubPatKey, pullRequestsKey, refreshIntervalKey } from '@/localStorageKeys'
import {
  type PullRequestLocalStorage,
  type PullRequest,
  type GraphQLViewerResult,
  type GraphQLResult,
} from '@/models/PullRequest'
import { initialDefaultTiming, noUpdateTiming } from '@/models/RefreshTiming'
import { CronJob, CronTime } from 'cron'

export const isLoadingPullRequests = ref(false)

const pat = useStorage(githubPatKey, '')
const username = ref('')
const initialized = ref(false)
const refreshIntervalTime = useStorage<string>(refreshIntervalKey, initialDefaultTiming)
const pullRequest = useStorage<PullRequestLocalStorage>(pullRequestsKey, {})

let refreshCronJob: CronJob
let octokit: Octokit

interface UseGitHubReturn {
  extractGitHubRepoFromUrl: (url: string) => { owner: string; name: string }
  fetchPullRequests: () => void
  getPullRequests: () => PullRequest[]
  setInterval: (interval: string) => void
  getInterval: () => string
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
    const result: GraphQLViewerResult = await octokit.graphql<GraphQLViewerResult>(query)
    return result.viewer.login
  }

  const fetchPullRequests = async () => {
    console.log('fetchPullRequests: start (GraphQL)')
    isLoadingPullRequests.value = true
    // Get username if not set
    if (!username.value) {
      username.value = await fetchViewerLogin()
    }
    // GraphQL query for PRs involving the user
    const query = `
      query($after: String) {
        search(query: "type:pr state:open involves:@me", type: ISSUE, first: 50, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            ... on PullRequest {
              id
              number
              title
              updatedAt
              url
              repository {
                name
                owner { login }
              }
              isDraft
              reviewRequests(first: 10) {
                nodes { requestedReviewer { ... on User { login } } }
              }
              reviews(last: 10, author: "${username.value}") {
                nodes {
                  state
                  submittedAt
                }
              }
              labels(first: 10) {
                nodes { name color }
              }
            }
          }
        }
      }
    `
    let hasNextPage = true
    let after: string | null = null
    const allPRs: PullRequest[] = []
    while (hasNextPage) {
      const result: GraphQLResult = await octokit.graphql<GraphQLResult>(query, { after })
      const search = result.search
      for (const pr of search.nodes) {
        if (typeof pr.isDraft === 'undefined') continue; // skip non-PRs or PRs without draft field
        let reviewStatus = 'not reviewed'
        if (pr.reviewRequests.nodes.some((n) => n.requestedReviewer?.login === username.value)) {
          reviewStatus = 'pending'
        } else if (pr.reviews.nodes.length > 0) {
          const latest = pr.reviews.nodes[pr.reviews.nodes.length - 1]
          reviewStatus = latest.state.toLowerCase()
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
      hasNextPage = search.pageInfo.hasNextPage
      after = search.pageInfo.endCursor
    }
    // Store PRs
    pullRequest.value = {}
    for (const pr of allPRs) {
      pullRequest.value[pr.number] = pr
    }
    isLoadingPullRequests.value = false
  }

  const getPullRequests = (): PullRequest[] => {
    return Object.values<PullRequest>(pullRequest.value).sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    )
  }

  const extractGitHubRepoFromUrl = (url: string): { owner: string; name: string } => {
    const match = url.match(/github\.com\/(?:repos\/)?(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
    if (!match || !(match.groups?.owner && match.groups?.name)) return { name: '', owner: '' }
    return {
      name: match.groups.name,
      owner: match.groups.owner,
    }
  }

  const setInterval = (intervalInput: string) => {
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

  if (!initialized.value) {
    if (pat.value.length == 0) {
      pat.value = askForPat()
    }
    octokit = new Octokit({
      auth: pat.value,
      userAgent: 'my-prs/v0.0.0',
      previews: ['shadow-cat'],
    })
    fetchViewerLogin().then(login => { username.value = login })
    refreshCronJob = new CronJob(initialDefaultTiming, fetchPullRequests)
    if (Object.keys(pullRequest.value).length == 0) {
      fetchPullRequests()
    }
    refreshCronJob.start()
    initialized.value = true
  }

  return {
    getPullRequests,
    extractGitHubRepoFromUrl,
    fetchPullRequests,
    setInterval,
    getInterval,
  }
}
