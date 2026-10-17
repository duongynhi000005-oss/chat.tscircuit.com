// https://docs.tscircuit.com/guides/running-tscircuit-inside-an-iframe
import { useEffect, useRef, useState } from "react"
import { Button } from "./ui/button"
import { SparklesIcon } from "./icons"

export interface TscircuitIframeProps {
  fsMap: Record<string, string>
  entrypoint: string
  onError?: (errorMessage: string) => void
  onFixWithAi?: (errorMessage: string) => void
}

export function extractRunframeErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const payload = data as {
    type?: string
    runframe_event?: {
      type?: string
      error_message?: string
    }
  }
  if (
    payload.type === "runframe_event" &&
    payload.runframe_event?.type === "error" &&
    typeof payload.runframe_event.error_message === "string"
  ) {
    const trimmed = payload.runframe_event.error_message.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

export function buildFixWithAiPrompt(errorMessage: string): string {
  const trimmed = errorMessage.trim()
  if (!trimmed) {
    return "Please fix the current error in the circuit code."
  }
  return `Please fix the following error in the circuit code:\n\n\`\`\`\n${trimmed}\n\`\`\``
}

export const TscircuitIframe = (runFrameProps: TscircuitIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [iframeHeight, setIframeHeight] = useState(600) // Default height for SSR
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  console.log(runFrameProps)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.runframe_type === "runframe_ready_to_receive") {
        setIsReady(true)
        iframeRef.current?.contentWindow?.postMessage(
          {
            runframe_type: "runframe_props_changed",
            runframe_props: {
              fsMap: runFrameProps.fsMap,
              entrypoint: runFrameProps.entrypoint,
            },
          },
          "*",
        )
      }

      const extractedError = extractRunframeErrorMessage(event.data)
      if (extractedError) {
        setErrorMessage(extractedError)
        runFrameProps.onError?.(extractedError)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  useEffect(() => {
    setErrorMessage(null)
    if (!iframeRef.current) return
    if (!isReady) return
    if (iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          runframe_type: "runframe_props_changed",
          runframe_props: {
            fsMap: runFrameProps.fsMap,
            entrypoint: runFrameProps.entrypoint,
          },
        },
        "*",
      )
    }
  }, [runFrameProps.fsMap, runFrameProps.entrypoint, isReady])

  // Set iframe height after component mounts to avoid SSR issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIframeHeight(Math.min(600, window.innerHeight - 50))
    }
  }, [])

  const handleFixWithAi = () => {
    if (!errorMessage) return
    runFrameProps.onFixWithAi?.(errorMessage)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("tscircuit:fix-with-ai", {
          detail: {
            errorMessage,
            prompt: buildFixWithAiPrompt(errorMessage),
          },
        }),
      )
    }
  }

  return (
    <div className="relative">
      {errorMessage && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900">
          <span className="text-xs font-mono text-red-700 dark:text-red-300 truncate">
            {errorMessage}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFixWithAi}
            className="h-7 px-2.5 text-xs gap-1.5 shrink-0 bg-white dark:bg-zinc-900"
          >
            <SparklesIcon size={14} />
            Fix with AI
          </Button>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="https://runframe.tscircuit.com/iframe.html"
        title="tscircuit code runner and preview"
        frameBorder="0"
        scrolling="no"
        style={{
          overflow: "hidden",
          width: "100%",
          height: iframeHeight,
          border: "none",
          padding: 0,
          margin: 0,
          boxSizing: "border-box",
        }}
      />
    </div>
  )
}
