export function bearerHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {},
) {
  const { token, headers: customHeaders, ...rest } = options
  const headers = new Headers(customHeaders)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return fetch(path, { ...rest, headers })
}
