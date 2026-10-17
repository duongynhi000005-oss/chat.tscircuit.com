export function extractChatMsgParam(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined,
): string | null {
  if (!searchParams) return null

  if (searchParams instanceof URLSearchParams) {
    const val = searchParams.get("chat_msg")
    return val && val.trim().length > 0 ? val.trim() : null
  }

  const raw = searchParams.chat_msg
  const val = Array.isArray(raw) ? raw[0] : raw
  return typeof val === "string" && val.trim().length > 0 ? val.trim() : null
}

export function buildPostAuthRedirectPath(
  searchParams: URLSearchParams,
): string {
  const nextParam = searchParams.get("next")
  const chatMsg = extractChatMsgParam(searchParams)

  let basePath = "/"
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    basePath = nextParam
  }

  if (!chatMsg) {
    return basePath
  }

  const dummyUrl = new URL(basePath, "https://chat.tscircuit.com")
  if (!dummyUrl.searchParams.has("chat_msg")) {
    dummyUrl.searchParams.set("chat_msg", chatMsg)
  }

  return `${dummyUrl.pathname}${dummyUrl.search}`
}

export function getTscircuitSessionTokenFromRequest(
  cookies: { get(name: string): { value: string } | undefined },
  searchParams: URLSearchParams,
): string | null {
  const urlToken =
    searchParams.get("session_token") ||
    searchParams.get("tscircuit_session_token")
  if (urlToken) return urlToken

  const cookieToken =
    cookies.get("session_token")?.value ||
    cookies.get("tscircuit_session_token")?.value
  return cookieToken || null
}

export function getCookieDomain(hostname?: string): string | undefined {
  if (!hostname) return undefined
  if (hostname === "tscircuit.com" || hostname.endsWith(".tscircuit.com")) {
    return ".tscircuit.com"
  }
  return undefined
}
