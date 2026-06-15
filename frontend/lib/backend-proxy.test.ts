import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { getBackendUrl, proxyToBackend } from "./backend-proxy"

describe("getBackendUrl", () => {
  afterEach(() => {
    delete process.env.BACKEND_URL
  })

  it("uses BACKEND_URL without trailing slash", () => {
    process.env.BACKEND_URL = "http://api.example.com/"
    expect(getBackendUrl()).toBe("http://api.example.com")
  })

  it("falls back to localhost", () => {
    expect(getBackendUrl()).toBe("http://127.0.0.1:8000")
  })
})

describe("proxyToBackend", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns fallback text when upstream fails with empty body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        headers: new Headers(),
        arrayBuffer: async () => new ArrayBuffer(0),
      }),
    )

    const request = new NextRequest("http://localhost:3000/api/documents/")
    const response = await proxyToBackend(request, "/api/documents/")

    expect(response.status).toBe(502)
    expect(await response.text()).toContain("Backend error 502")
  })

  it("forwards upstream body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({ "content-type": "application/json" }),
        arrayBuffer: async () => new TextEncoder().encode('{"ok":true}').buffer,
      }),
    )

    const request = new NextRequest("http://localhost:3000/api/documents/")
    const response = await proxyToBackend(request, "/api/documents/")

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"ok":true}')
  })
})
