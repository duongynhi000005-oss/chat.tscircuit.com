import { cookies } from "next/headers"

import { Chat } from "@/components/chat"
import { ChatMsgInitializer } from "@/components/chat-msg-initializer"
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models"
import { extractChatMsgParam } from "@/lib/auth/session-redirect"
import { generateUUID } from "@/lib/utils"
import { DataStreamHandler } from "@/components/data-stream-handler"

export default async function Page(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const id = generateUUID()
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined
  const chatMsg = extractChatMsgParam(resolvedSearchParams)

  const cookieStore = await cookies()
  const modelIdFromCookie = cookieStore.get("chat-model")

  if (!modelIdFromCookie) {
    return (
      <>
        <ChatMsgInitializer chatMsg={chatMsg} />
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType="private"
          isReadonly={false}
        />
        <DataStreamHandler id={id} />
      </>
    )
  }

  return (
    <>
      <ChatMsgInitializer chatMsg={chatMsg} />
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="private"
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  )
}
