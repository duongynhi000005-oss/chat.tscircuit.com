"use client"

import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { useBlock } from "@/hooks/use-block"
import type { UIBlock } from "./block"

interface CodeBlockProps {
  node: any
  inline: boolean
  className: string
  children: any
}

export function applyCodeToMainBlock({
  codeContent,
  setBlock,
  setMetadata,
}: {
  codeContent: string
  setBlock: (updaterFn: UIBlock | ((currentBlock: UIBlock) => UIBlock)) => void
  setMetadata: (updaterFn: any) => void
}) {
  setBlock((currentBlock) => ({
    ...currentBlock,
    kind: "code",
    title: currentBlock.title || "Circuit Preview",
    content: codeContent,
    isVisible: true,
    status: "idle",
  }))
  setMetadata((currentMetadata: any) => ({
    ...currentMetadata,
    circuitPreview: codeContent,
    timesRunWasPressed: (currentMetadata?.timesRunWasPressed ?? 0) + 1,
  }))
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const { setBlock, setMetadata } = useBlock()
  const match = /language-(\w+)/.exec(className || "")
  const isTsx = match?.[1] === "tsx" || match?.[1] === "typescript"
  const codeContent = String(children).replace(/\n$/, "")

  const handleRun = useCallback(() => {
    applyCodeToMainBlock({
      codeContent,
      setBlock,
      setMetadata,
    })
  }, [codeContent, setBlock, setMetadata])

  return (
    <div className="not-prose flex flex-col relative">
      <pre
        {...props}
        className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
      >
        <code className="whitespace-pre-wrap break-words">{children}</code>
      </pre>

      {isTsx && (
        <div className="absolute top-2 right-3">
          <button
            type="button"
            onClick={handleRun}
            className="px-2 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
          >
            Run
          </button>
        </div>
      )}
    </div>
  )
}
