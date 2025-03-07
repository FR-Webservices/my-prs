import { Octokit } from 'octokit'
import { type RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import { ref } from 'vue'

export const username = ref('')
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
  if (username.value == '') {
    // Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
    octokit = new Octokit({
      auth: ``,
      userAgent: 'my-github-todos/v0.0.0',
    })

    octokit.rest.users.getAuthenticated().then((data) => {
      username.value = data.data.login
      console.log('Hello, %s', username.value)
    })
  }

  const getOpenPullRequests = async (): Promise<
    RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']
  > => {
    return octokit.rest.search.issuesAndPullRequests({
      q: 'review-requested:@me+type:pr+state:open',
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

  return {
    getOpenPullRequests,
    extractGitHubRepoFromUrl,
    getRepository,
  }
}
