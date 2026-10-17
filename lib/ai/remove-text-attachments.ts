import { Message } from "ai"

export const removeTextAttachments = (messages: Message[]) => {
  return messages.map((message) => {
    const nonTextAttachments = message.experimental_attachments?.filter(
      (attachment) => attachment.contentType !== "text/plain",
    )

    return {
      ...message,
      experimental_attachments:
        nonTextAttachments && nonTextAttachments.length > 0
          ? nonTextAttachments
          : undefined,
    }
  })
}
