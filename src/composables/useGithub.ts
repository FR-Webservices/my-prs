import { Octokit } from 'octokit'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { githubPatKey, pullRequestsKey, refreshIntervalKey } from '@/localStorageKeys'
import {
  type PullRequestLocalStorage,
  type PullRequestSearchItem,
  type RepositoryResponse,
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
  getPullRequests: () => PullRequestSearchItem[]
  getRepository: (owner: string, name: string) => Promise<RepositoryResponse>
  setInterval: (interval: string) => void
  getInterval: () => string
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
        const returnedPRs: number[] = []
        pullRequests.forEach((pr) => {
          pullRequest.value[pr.id] = pr
          returnedPRs.push(pr.id)
        })

        for (const id of Object.keys(pullRequest.value)) {
          if (
            returnedPRs.findIndex((it) => {
              return it == +id
            }) == -1
          ) {
            delete pullRequest.value[+id]
          }
        }

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
    })

    octokit.rest.users.getAuthenticated().then((data) => {
      username.value = data.data.login
    })

    refreshCronJob = new CronJob(initialDefaultTiming, fetchPullRequests)
    refreshCronJob.start()

    initialized.value = true
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
