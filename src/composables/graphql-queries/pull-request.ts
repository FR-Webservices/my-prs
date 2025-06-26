// --- GraphQL queries and enums at top ---
export const PULL_REQUESTS_QUERY = `
  query($after: String, $author: String!) {
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
          reviews(last: 10, author: $author) {
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
