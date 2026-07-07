/**
 * Server-side PostHog reads for the admin dashboard. Runs HogQL against the
 * PostHog query API using the (secret) personal API key. Every call degrades to
 * an empty result on any failure — missing creds, network error, or query
 * error — so the dashboard never breaks because of analytics.
 */

const API_HOST = process.env.POSTHOG_API_HOST || 'https://eu.posthog.com'

export function posthogConfigured(): boolean {
  return Boolean(process.env.POSTHOG_PERSONAL_API_KEY && process.env.POSTHOG_PROJECT_ID)
}

export async function hogql(query: string): Promise<Array<Array<string | number | null>>> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  if (!key || !projectId) return []
  try {
    const res = await fetch(`${API_HOST}/api/projects/${projectId}/query/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: Array<Array<string | number | null>> }
    return data.results ?? []
  } catch {
    return []
  }
}
