import { describe, expect, test } from "bun:test"
import type { Message } from "ai"
import { removeTextAttachments } from "../lib/ai/remove-text-attachments"
import { getTextAttachmentStrings } from "../lib/ai/get-text-attachment-strings"

describe("image and text attachment handling", () => {
  test("preserves image attachments while removing text/plain package attachments", () => {
    const messages: Message[] = [
      {
        id: "msg-1",
        role: "user",
        content: "Design this circuit using @seveibar/usb-c",
        experimental_attachments: [
          {
            name: "seveibar/usb-c",
            contentType: "text/plain",
            url: `data:text/plain;charset=utf-8,${encodeURIComponent("Module: @tsci/seveibar.usb-c")}`,
          },
          {
            name: "schematic.png",
            contentType: "image/png",
            url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          },
        ],
      },
      {
        id: "msg-2",
        role: "user",
        content: "Only text attachment here",
        experimental_attachments: [
          {
            name: "seveibar/led",
            contentType: "text/plain",
            url: `data:text/plain;charset=utf-8,${encodeURIComponent("Module: @tsci/seveibar.led")}`,
          },
        ],
      },
    ]

    const textStrings = getTextAttachmentStrings(messages)
    expect(textStrings).toEqual([
      "Module: @tsci/seveibar.usb-c",
      "Module: @tsci/seveibar.led",
    ])

    const cleaned = removeTextAttachments(messages)
    expect(cleaned[0].experimental_attachments).toEqual([
      {
        name: "schematic.png",
        contentType: "image/png",
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    ])
    expect(cleaned[1].experimental_attachments).toBeUndefined()
  })
})
