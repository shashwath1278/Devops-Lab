import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth/next"

function resolveLoginUrl(): string {
  if (process.env.NEXTAUTH_BACKEND_URL) {
    return process.env.NEXTAUTH_BACKEND_URL
  }
  const backend = process.env.BACKEND_URL
  if (backend) {
    return `${backend.replace(/\/$/, "")}/api/auth/login`
  }
  return "/api/auth/login"
}

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
          const backendUrl = resolveLoginUrl()
          const res = await fetch(backendUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
          })

          if (!res.ok) {
            console.error("[auth] Login failed:", res.status, res.statusText)
            return null
          }

          const data = await res.json()
          const accessToken = data.access_token || data.token
          if (!accessToken) {
            console.error("[auth] No access_token in login response")
            return null
          }

          return {
            id: data.user_id || data.id,
            name: data.username,
            email: data.email,
            token: accessToken,
          }
        } catch (error) {
          console.error("[auth] Login error:", error)
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
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)

export async function auth() {
  return getServerSession(authOptions)
}
