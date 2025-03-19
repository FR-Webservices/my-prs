import { Octokit } from 'octokit'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { githubPatKey, pullRequestsKey, refreshIntervalKey } from '@/localStorageKeys'
import {
  type PullRequestLocalStorage,
  type PullRequestSearchItem,
  type RepositoryResponse,
} from '@/models/PullRequest'
import { initialDefaultTiming } from '@/models/RefreshTiming'

export const isLoadingPullRequests = ref(false)

const pat = useStorage(githubPatKey, '')
const username = ref('')
const initialized = ref(false)
const refreshIntervalTime = useStorage<number>(refreshIntervalKey, initialDefaultTiming)
const pullRequest = useStorage<PullRequestLocalStorage>(pullRequestsKey, {})

let refreshInterval: number | undefined = undefined

let octokit: Octokit

interface UseGitHubReturn {
  extractGitHubRepoFromUrl: (url: string) => { owner: string; name: string }
  fetchPullRequests: () => void
  getPullRequests: () => PullRequestSearchItem[]
  getRepository: (owner: string, name: string) => Promise<RepositoryResponse>
  setInterval: (interval: number) => void
  getInterval: () => number
}

export function useGitHub(): UseGitHubReturn {
  const askForPat = (): string => {
    let patPrompt: string | null

    while (true) {
      // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
      patPrompt = prompt(
        'Please enter your personal access token from GitHub. It should have at least the "repo" scope enabled to get also access to private repositories',
        '',
      )
      if (
        !patPrompt?.match(/^(gh[ps]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})$/)
      ) {
        alert("You haven't entered a valid token! Please try again.")
      }
      break
    }

    return patPrompt!
  }

  const fetchPullRequests = async () => {
    console.log('fetchPullRequests: start')
    isLoadingPullRequests.value = true

    octokit
      .paginate(octokit.rest.search.issuesAndPullRequests, {
        q: 'type:pr+state:open+involves:@me',
        sort: 'updated',
      })
      .then((pullRequests: PullRequestSearchItem[]) => {
        pullRequests.forEach((pr) => {
          pullRequest.value[pr.id] = pr
        })
        isLoadingPullRequests.value = false
      })
  }

  const getPullRequests = (): PullRequestSearchItem[] => {
    return Object.values<PullRequestSearchItem>(pullRequest.value).sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    )
  }

  const getRepository = async (owner: string, name: string): Promise<RepositoryResponse> => {
    return octokit.rest.repos.get({ owner: owner, repo: name })
  }

  const extractGitHubRepoFromUrl = (url: string): { owner: string; name: string } => {
    const match = url.match(/^https?:\/\/(www\.)?github.com\/(?<owner>[\w.-]+)\/(?<name>[\w.-]+)/)
    if (!match || !(match.groups?.owner && match.groups?.name)) return { name: '', owner: '' }

    return {
      name: match.groups.name,
      owner: match.groups.owner,
    }
  }

  const setInterval = (intervalInput: number) => {
    console.log('setInterval', intervalInput)
    refreshIntervalTime.value = intervalInput

    if (refreshIntervalTime.value === -1) {
      clearRefreshInterval()
      return
    }

    setupRefreshInterval(intervalInput)
  }

  const getInterval = (): number => {
    console.log('getInterval', refreshIntervalTime.value)
    return refreshIntervalTime.value
  }

  const setupRefreshInterval = (newIntervalTime: number): void => {
    console.log('setupRefreshInterval: start', newIntervalTime)
    if (refreshInterval !== undefined) {
      clearRefreshInterval()
    }

    if (refreshIntervalTime.value === -1) {
      console.log('setupRefreshInterval: disabled')
      return
    }

    refreshInterval = window.setInterval(fetchPullRequests, newIntervalTime)
  }

  const clearRefreshInterval = () => {
    console.log('setupRefreshInterval: clear interval')
    window.clearInterval(refreshInterval)
  }

  if (!initialized.value) {
    if (pat.value.length == 0) {
      pat.value = askForPat()
    }

    octokit = new Octokit({
      auth: pat.value,
      userAgent: 'my-prs/v0.0.0',
    })

    octokit.rest.users.getAuthenticated().then((data) => {
      username.value = data.data.login
    })

    initialized.value = true
    setupRefreshInterval(refreshIntervalTime.value)
  }

  return {
    getPullRequests,
    getRepository,
    extractGitHubRepoFromUrl,
    fetchPullRequests,
    setInterval,
    getInterval,
  }
}
