import Link from "next/link"
import React, { memo } from "react"
import { Streamdown, type StreamdownProps } from "streamdown"
import { CodeBlock } from "./code-block"

type Components = StreamdownProps["components"]

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    )
  },
}

const NonMemoizedMarkdown = ({ children }: { children: string }) => (
  <Streamdown components={components}>{children}</Streamdown>
)

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
)
