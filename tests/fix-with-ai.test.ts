import { describe, expect, test } from "bun:test"
import {
  buildFixWithAiPrompt,
  extractRunframeErrorMessage,
} from "../components/TscircuitIframe"

describe("Fix with AI error extraction and prompt formatting", () => {
  test("extracts error_message from runframe_event error payloads", () => {
    expect(
      extractRunframeErrorMessage({
        type: "runframe_event",
        runframe_event: {
          type: "error",
          error_message:
            'Invalid footprint function, got "smd", from string "smd-diode"',
        },
      }),
    ).toBe('Invalid footprint function, got "smd", from string "smd-diode"')

    expect(
      extractRunframeErrorMessage({
        runframe_type: "runframe_ready_to_receive",
      }),
    ).toBeNull()

    expect(extractRunframeErrorMessage(null)).toBeNull()
  })

  test("formats the AI fix prompt with the captured error message", () => {
    const prompt = buildFixWithAiPrompt(
      'Invalid footprint function, got "smd", from string "smd-diode"',
    )
    expect(prompt).toContain(
      "Please fix the following error in the circuit code:",
    )
    expect(prompt).toContain(
      'Invalid footprint function, got "smd", from string "smd-diode"',
    )
    expect(buildFixWithAiPrompt("   ")).toBe(
      "Please fix the current error in the circuit code.",
    )
  })
})
