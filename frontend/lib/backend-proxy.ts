import { NextRequest, NextResponse } from "next/server"

export function getBackendUrl(): string {
  return (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "")
}

/** Server-side proxy to the FastAPI backend (avoids browser mixed-content blocks). */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const base = getBackendUrl()
  const path = backendPath.startsWith("/") ? backendPath : `/${backendPath}`
  const search = request.nextUrl.search
  const url = `${base}${path}${search}`

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === "host" || lower === "connection") return
    headers.set(key, value)
  })

  const method = request.method
  let body: ArrayBuffer | undefined
  if (method !== "GET" && method !== "HEAD") {
    body = await request.arrayBuffer()
  }

  const upstream = await fetch(url, { method, headers, body })

  const responseHeaders = new Headers()
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return
    responseHeaders.set(key, value)
  })

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}
