import { Octokit } from 'octokit'
import { type RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'

const pat = useStorage('github-pat', '')
const username = ref('')
const initialized = ref(false)

let octokit: Octokit

interface UseGitHubReturn {
  getOpenPullRequests: () => Promise<
    RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']
  >
  extractGitHubRepoFromUrl: (url: string) => { owner: string; name: string }
  getRepository: (
    owner: string,
    name: string,
  ) => Promise<RestEndpointMethodTypes['repos']['get']['response']>
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

  const getOpenPullRequests = async (): Promise<
    RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']
  > => {
    return octokit.rest.search.issuesAndPullRequests({
      q: 'type:pr+state:open+involves:@me',
      sort: 'updated',
    })
  }

  const getRepository = async (
    owner: string,
    name: string,
  ): Promise<RestEndpointMethodTypes['repos']['get']['response']> => {
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
  }

  return {
    getOpenPullRequests,
    extractGitHubRepoFromUrl,
    getRepository,
  }
}
