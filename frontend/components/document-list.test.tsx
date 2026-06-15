import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import DocumentList from "./document-list"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}))

describe("DocumentList", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows API error detail when document fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Failed to load documents from database" }),
      }),
    )

    render(<DocumentList />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load documents from database")).toBeInTheDocument()
    })
  })
})
