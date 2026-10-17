import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"
import type { SessionData } from "@/app/(auth)/auth-store"
import {
  extractChatMsgParam,
  getCookieDomain,
  getTscircuitSessionTokenFromRequest,
} from "@/lib/auth/session-redirect"

function buildLoginRedirectUrl(request: NextRequest): URL {
  const loginUrl = new URL("/login", request.url)
  const chatMsg = extractChatMsgParam(request.nextUrl.searchParams)
  if (chatMsg) {
    loginUrl.searchParams.set("chat_msg", chatMsg)
  }
  const currentTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`
  if (currentTarget && currentTarget !== "/" && currentTarget !== "/login") {
    loginUrl.searchParams.set("next", currentTarget)
  }
  return loginUrl
}

// This middleware runs on every request
export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl

  // Allow public routes to bypass authentication checks
  if (pathname.startsWith("/login") || pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  // Check for session token in cookies (including shared tscircuit.com session token)
  const sessionToken =
    request.cookies.get("session_token")?.value ||
    request.cookies.get("tscircuit_session_token")?.value

  // Check for session token in URL query parameter (for OAuth redirects)
  const url = request.nextUrl.clone()
  const urlSessionToken =
    url.searchParams.get("session_token") ||
    url.searchParams.get("tscircuit_session_token")
  const cookieDomain = getCookieDomain(request.nextUrl.hostname)

  // If token is in URL, verify it and set a cookie
  if (urlSessionToken) {
    try {
      const decoded = jose.decodeJwt<SessionData>(urlSessionToken)

      // Check if token is valid
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Clean the URL by removing the session_token parameter
        url.searchParams.delete("session_token")
        url.searchParams.delete("tscircuit_session_token")

        // Create a new response with the cleaned URL
        const response = NextResponse.redirect(url)

        // Set the token in a cookie
        response.cookies.set({
          name: "session_token",
          value: urlSessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
          ...(cookieDomain ? { domain: cookieDomain } : {}),
        })

        return response
      }
    } catch (error) {
      // Invalid token in URL
      console.error("Invalid session token in URL:", error)
    }
  }

  if (pathname.startsWith("/api/")) {
    // Allow public read access to documents for shared chats
    if (pathname.startsWith("/api/document") && request.method === "GET") {
      return NextResponse.next()
    }

    const activeToken = getTscircuitSessionTokenFromRequest(
      request.cookies,
      request.nextUrl.searchParams,
    )

    if (!activeToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const decoded = jose.decodeJwt<SessionData>(activeToken)

      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "Token expired" }, { status: 401 })
      }

      // Valid token for API routes, continue
      return NextResponse.next()
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  }

  // For non-API routes, redirect to login if no valid token
  if (!sessionToken) {
    return NextResponse.redirect(buildLoginRedirectUrl(request))
  }

  try {
    const decoded = jose.decodeJwt<SessionData>(sessionToken)

    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      // Token expired, redirect to login
      const response = NextResponse.redirect(buildLoginRedirectUrl(request))
      response.cookies.delete("session_token")
      return response
    }

    // Valid token, let the request proceed
    return NextResponse.next()
  } catch (error) {
    // Invalid token, redirect to login
    console.error("Invalid session token:", error)
    const response = NextResponse.redirect(buildLoginRedirectUrl(request))
    response.cookies.delete("session_token")
    return response
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ["/", "/new", "/:id", "/api/:path*", "/login"],
}
