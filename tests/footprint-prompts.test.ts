import { describe, expect, test } from "bun:test"
import {
  codePrompt,
  systemPrompt,
  updateDocumentPrompt,
} from "../lib/ai/prompts/prompts"

describe("AI footprint prompt guidance", () => {
  test("does not instruct the model to use the invalid smd-diode default footprint", () => {
    const sys = systemPrompt({
      selectedChatModel: "circuit-engineer-small",
      textAttachmentStrings: [],
    })

    expect(sys).not.toContain('default footprint "smd-diode"')
    expect(codePrompt).not.toContain('default footprint "smd-diode"')
  })

  test("includes valid diode footprints and warns against invalid footprint names in codePrompt and updateDocumentPrompt", () => {
    expect(codePrompt).toContain('"sod123"')
    expect(codePrompt).toContain('"0402"')
    expect(codePrompt).toContain(
      'Never use hyphenated descriptions like "smd-diode"',
    )
    expect(codePrompt).toContain('"D_SOD-123"')

    const updatePrompt = updateDocumentPrompt(
      "export default () => <board />",
      "code",
    )
    expect(updatePrompt).toContain("## Common Footprints")
    expect(updatePrompt).toContain('"sod123"')
    expect(updatePrompt).toContain("export default () => <board />")
  })
})
