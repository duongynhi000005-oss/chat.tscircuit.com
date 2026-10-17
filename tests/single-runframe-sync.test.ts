import { describe, expect, test } from "bun:test"
import { getActiveCircuitPreview, type Metadata } from "@/blocks/code/client"
import { applyCodeToMainBlock } from "@/components/code-block"
import { initialBlockData } from "@/hooks/use-block"

describe("single main runframe sync as chat progresses", () => {
  test("getActiveCircuitPreview returns empty string before Run is pressed", () => {
    expect(
      getActiveCircuitPreview({
        content: "export default () => <board />",
        status: "idle",
        metadata: { circuitPreview: "" },
      }),
    ).toBe("")
  })

  test("getActiveCircuitPreview applies updated block content to main runframe when idle", () => {
    const initialCode = 'export default () => <board width="10mm" />'
    const updatedCode = 'export default () => <board width="20mm" />'

    expect(
      getActiveCircuitPreview({
        content: updatedCode,
        status: "idle",
        metadata: { circuitPreview: initialCode, timesRunWasPressed: 1 },
      }),
    ).toBe(updatedCode)
  })

  test("applyCodeToMainBlock updates the main block and circuitPreview metadata instead of starting a secondary runframe", () => {
    let blockState = {
      ...initialBlockData,
      documentId: "doc-1",
      title: "5x4 LED Matrix",
      kind: "code" as const,
      content: 'export default () => <board width="10mm" />',
      isVisible: true,
    }
    let metadataState: Metadata = {
      circuitPreview: 'export default () => <board width="10mm" />',
      timesRunWasPressed: 1,
    }

    const updatedCode = 'export default () => <board width="25mm" />'

    applyCodeToMainBlock({
      codeContent: updatedCode,
      setBlock: (updater) => {
        blockState =
          typeof updater === "function" ? updater(blockState) : updater
      },
      setMetadata: (updater) => {
        metadataState =
          typeof updater === "function" ? updater(metadataState) : updater
      },
    })

    expect(blockState.content).toBe(updatedCode)
    expect(blockState.isVisible).toBe(true)
    expect(blockState.kind).toBe("code")
    expect(metadataState.circuitPreview).toBe(updatedCode)
    expect(metadataState.timesRunWasPressed).toBe(2)
  })
})
