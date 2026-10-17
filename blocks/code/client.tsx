import { Block } from "@/components/create-block"
import { CodeEditor } from "@/components/code-editor"
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons"
import { toast } from "sonner"
import { TscircuitIframe } from "@/components/TscircuitIframe"
import { BottomContentDrawer } from "@/components/bottom-content-drawer"
// import { RunFrame } from '@tscircuit/runframe/runner';

export interface Metadata {
  // Instead of a list of console outputs, we now store the circuit code
  // to be rendered in the preview.
  circuitPreview?: string
  timesRunWasPressed?: number
}

export function getActiveCircuitPreview({
  content,
  status,
  metadata,
}: {
  content?: string
  status?: "streaming" | "idle"
  metadata?: Metadata | null
}): string {
  if (!metadata?.circuitPreview) return ""
  if (status === "idle" && content) return content
  return metadata.circuitPreview
}

export const codeBlock = new Block<"code", Metadata>({
  kind: "code",
  description:
    "Useful for code generation; Code execution is now replaced with a tscircuit runner that converts React code into circuits.",
  initialize: async ({ setMetadata }) => {
    setMetadata((metadata) => ({
      ...metadata,
      circuitPreview: metadata?.circuitPreview ?? "",
    }))
  },
  onStreamPart: ({ streamPart, setBlock, setMetadata }) => {
    if (streamPart.type === "code-delta") {
      const nextContent = streamPart.content as string
      setBlock((draftBlock) => ({
        ...draftBlock,
        content: nextContent,
        isVisible:
          draftBlock.status === "streaming" &&
          draftBlock.content.length > 300 &&
          draftBlock.content.length < 310
            ? true
            : draftBlock.isVisible,
        status: "streaming",
      }))
      setMetadata((metadata) =>
        metadata?.circuitPreview
          ? {
              ...metadata,
              circuitPreview: nextContent,
            }
          : metadata,
      )
    }
  },
  content: ({ metadata, setMetadata, ...props }) => {
    const activeCircuitPreview = getActiveCircuitPreview({
      content: props.content,
      status: props.status,
      metadata,
    })

    return (
      <div className="relative">
        <div className="px-1">
          <CodeEditor {...props} />
        </div>
        {/* Render the tscircuit runner preview if circuit code exists */}
        {activeCircuitPreview && (
          <BottomContentDrawer
            timesRunWasPressed={metadata?.timesRunWasPressed ?? 0}
            openByDefault
          >
            <TscircuitIframe
              fsMap={{
                "board.tsx": activeCircuitPreview,
                "entrypoint.tsx": `import Board from "./board.tsx"\ncircuit.add(<Board />)`,
              }}
              entrypoint="entrypoint.tsx"
            />
          </BottomContentDrawer>
        )}
      </div>
    )
  },
  actions: [
    {
      icon: <PlayIcon size={18} />,
      label: "Run",
      description: "Execute circuit code using tscircuit runner",
      onClick: async ({ content, setMetadata }) => {
        setMetadata((metadata) => ({
          ...metadata,
          circuitPreview: content,
          timesRunWasPressed: (metadata.timesRunWasPressed ?? 0) + 1,
        }))
      },
    },
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev")
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next")
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy code to clipboard",
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content)
        toast.success("Copied to clipboard!")
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Add comments",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Add comments to the code snippet for understanding",
        })
      },
    },
    {
      icon: <LogsIcon />,
      description: "Add logs",
      onClick: ({ appendMessage }) => {
        appendMessage({
          role: "user",
          content: "Add logs to the code snippet for debugging",
        })
      },
    },
  ],
})
