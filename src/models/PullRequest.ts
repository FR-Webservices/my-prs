export type PullRequest = {
  id: string
  number: number
  title: string
  updated_at: string
  html_url: string
  repository_url: string
  draft?: boolean
  reviewStatus: string
  labels: { name: string; color: string }[]
}

export type PullRequestLocalStorage = Record<number, PullRequest>

// --- GraphQL Types ---
type GraphQLReviewNode = {
  state: string
  submittedAt: string
}
type GraphQLReviewRequestNode = {
  requestedReviewer: { login: string } | null
}
type GraphQLLabelNode = {
  name: string
  color: string
}
type GraphQLRepository = {
  name: string
  owner: { login: string }
}
type GraphQLPRNode = {
  id: string
  number: number
  title: string
  updatedAt: string
  url: string
  repository: GraphQLRepository
  isDraft: boolean
  reviewRequests: { nodes: GraphQLReviewRequestNode[] }
  reviews: { nodes: GraphQLReviewNode[] }
  labels: { nodes: GraphQLLabelNode[] }
}
type GraphQLSearch = {
  pageInfo: { hasNextPage: boolean; endCursor: string }
  nodes: GraphQLPRNode[]
}
export type GraphQLResult = { search: GraphQLSearch }
export type GraphQLViewerResult = { viewer: { login: string } }
