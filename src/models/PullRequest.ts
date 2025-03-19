import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import type { InferArrayType } from './utils'

export type RepositoryResponse = RestEndpointMethodTypes['repos']['get']['response']

export type PullRequestSearchItem = InferArrayType<
  RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']['items']
>

export type PullRequestLocalStorage = Record<number, PullRequestSearchItem>
