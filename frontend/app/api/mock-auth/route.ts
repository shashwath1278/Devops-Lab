import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    // Demo credentials: username/password
    if (username === "username" && password === "password") {
      return NextResponse.json({
        user_id: "user-123",
        id: "user-123",
        username: "username",
        email: "student@example.com",
        token: "mock-jwt-token",
      })
    }

    // Invalid credentials
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("[v0] Mock auth error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
