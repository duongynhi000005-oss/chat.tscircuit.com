import { describe, expect, test } from "bun:test"
import {
  buildPostAuthRedirectPath,
  extractChatMsgParam,
  getCookieDomain,
  getTscircuitSessionTokenFromRequest,
} from "../lib/auth/session-redirect"

describe("session-redirect and /new?chat_msg= helpers", () => {
  test("extractChatMsgParam reads chat_msg from URLSearchParams and record", () => {
    const params = new URLSearchParams(
      "chat_msg=make%20a%20555%20timer%20circuit",
    )
    expect(extractChatMsgParam(params)).toBe("make a 555 timer circuit")

    expect(extractChatMsgParam({ chat_msg: "  design an LED blinker  " })).toBe(
      "design an LED blinker",
    )

    expect(
      extractChatMsgParam({ chat_msg: ["first prompt", "second prompt"] }),
    ).toBe("first prompt")

    expect(extractChatMsgParam({ chat_msg: "   " })).toBeNull()
    expect(extractChatMsgParam(null)).toBeNull()
  })

  test("buildPostAuthRedirectPath preserves chat_msg and safe next paths", () => {
    const params1 = new URLSearchParams(
      "session_token=abc&chat_msg=hello+world",
    )
    expect(buildPostAuthRedirectPath(params1)).toBe("/?chat_msg=hello+world")

    const params2 = new URLSearchParams(
      "session_token=abc&next=%2Fnew&chat_msg=build+board",
    )
    expect(buildPostAuthRedirectPath(params2)).toBe("/new?chat_msg=build+board")

    const paramsWithMaliciousNext = new URLSearchParams(
      "next=//evil.com&chat_msg=hello",
    )
    expect(buildPostAuthRedirectPath(paramsWithMaliciousNext)).toBe(
      "/?chat_msg=hello",
    )
  })

  test("getTscircuitSessionTokenFromRequest reads session_token or tscircuit_session_token", () => {
    const mockCookies = {
      map: new Map<string, string>([
        ["tscircuit_session_token", "shared_cookie_jwt"],
      ]),
      get(name: string) {
        const val = this.map.get(name)
        return val ? { value: val } : undefined
      },
    }

    expect(
      getTscircuitSessionTokenFromRequest(mockCookies, new URLSearchParams()),
    ).toBe("shared_cookie_jwt")

    expect(
      getTscircuitSessionTokenFromRequest(
        mockCookies,
        new URLSearchParams("session_token=url_jwt"),
      ),
    ).toBe("url_jwt")
  })

  test("getCookieDomain returns .tscircuit.com for tscircuit subdomains", () => {
    expect(getCookieDomain("chat.tscircuit.com")).toBe(".tscircuit.com")
    expect(getCookieDomain("tscircuit.com")).toBe(".tscircuit.com")
    expect(getCookieDomain("localhost")).toBeUndefined()
  })
})
