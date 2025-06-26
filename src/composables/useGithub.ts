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
      .then(async (pullRequests: PullRequestSearchItem[]) => {
        const returnedPRs: number[] = []
        for (const pr of pullRequests) {
          const { owner, name } = extractGitHubRepoFromUrl(pr.repository_url)
          if (!owner || !name) {
            console.warn('Could not extract owner/repo from', pr.repository_url)
            pr.reviewStatus = 'unknown'
            pullRequest.value[pr.id] = pr
            returnedPRs.push(pr.id)
            continue
          }

          // Fetch review status for PR
          pr.reviewStatus = await fetchReviewStatusForPR(owner, name, pr.number, username.value)
          pullRequest.value[pr.id] = pr
          returnedPRs.push(pr.id)
        }

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

  async function fetchReviewStatusForPR(owner: string, repo: string, prNumber: number, username: string): Promise<string> {
    // 1. Fetch PR details
    const prDetails = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
    // 2. Fetch reviews

    const { data: reviews } = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    // 3. Find the latest review by the user
    const userReviews = reviews.filter(r => r.user?.login === username);
    if (userReviews.length === 0) {
      // If you are a requested reviewer, status is pending
      const requestedReviewers = (prDetails.data.requested_reviewers as Array<{ login: string }> | undefined)?.map(u => u.login) || [];
      if (requestedReviewers.includes(username)) {
        return 'pending';
      }
      return 'not reviewed';
    }
    const latestReview = userReviews[userReviews.length - 1];

    // 4. Get the latest commit date
    const latestCommitSha = prDetails.data.head.sha;
    const commit = await octokit.rest.repos.getCommit({ owner, repo, ref: latestCommitSha });
    const latestCommitDate = new Date(commit.data.commit.committer?.date || commit.data.commit.author?.date || prDetails.data.updated_at);
    const latestReviewDate = new Date(latestReview.submitted_at || "");

    // 5. If review is before latest commit, status is pending/stale
    if (latestReviewDate < latestCommitDate) {
      return 'pending';
    }

    // 6. Otherwise, use the review state
    return latestReview.state.toLowerCase(); // "approved", "changes_requested", "commented", etc.
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
    })

    octokit.rest.users.getAuthenticated().then((data) => {
      username.value = data.data.login
    })

    refreshCronJob = new CronJob(initialDefaultTiming, fetchPullRequests)

    // if no pr's in local storage trigger initial fetch
    if (Object.keys(pullRequest.value).length == 0) {
      fetchPullRequests()
    }

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
