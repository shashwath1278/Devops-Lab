import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        try {
          const backendUrl = process.env.NEXTAUTH_BACKEND_URL || "/api/mock-auth"
          const res = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          })

          if (!res.ok) {
            console.error("[v0] Auth failed:", res.status, res.statusText)
            return null
          }

          let data
          try {
            data = await res.json()
          } catch (parseError) {
            console.error("[v0] Failed to parse response as JSON:", parseError)
            return null
          }

          return {
            id: data.user_id || data.id,
            name: data.username,
            email: data.email,
            token: data.token,
          }
        } catch (error) {
          console.error("[v0] Auth error:", error)
          return null
        }
      },
    } as any,
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.token = user.token
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        ;(session as any).token = token.token
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key",
}

export default NextAuth(authOptions)

export async function auth() {
  return getServerSession(authOptions)
}
