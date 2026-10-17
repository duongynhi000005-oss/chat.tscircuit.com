"use client"

import { useEffect } from "react"

export function ChatMsgInitializer({ chatMsg }: { chatMsg?: string | null }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const msg = chatMsg || urlParams.get("chat_msg")
    if (!msg || !msg.trim()) return

    localStorage.setItem("input", JSON.stringify(msg.trim()))

    const textarea = document.querySelector(
      'textarea[name="input"]',
    ) as HTMLTextAreaElement | null
    if (textarea) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value",
      )?.set
      nativeSetter?.call(textarea, msg.trim())
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
    }

    urlParams.delete("chat_msg")
    const nextSearch = urlParams.toString()
    const cleanPath =
      window.location.pathname === "/new" ? "/" : window.location.pathname
    window.history.replaceState(
      {},
      document.title,
      nextSearch ? `${cleanPath}?${nextSearch}` : cleanPath,
    )
  }, [chatMsg])

  return null
}
