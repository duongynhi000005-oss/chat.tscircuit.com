import { expect, test } from "bun:test"
import { isInlineCode } from "../components/code-block"

test("detects inline backtick code vs fenced code blocks", () => {
  expect(
    isInlineCode({
      inline: true,
      children: "resistor",
    }),
  ).toBe(true)

  expect(
    isInlineCode({
      inline: false,
      children: "resistor",
    }),
  ).toBe(false)

  expect(
    isInlineCode({
      className: "",
      children: "0402",
      node: {
        position: {
          start: { line: 3 },
          end: { line: 3 },
        },
      },
    }),
  ).toBe(true)

  expect(
    isInlineCode({
      className: "language-tsx",
      children: '<resistor name="R1" resistance="1k" />',
      node: {
        position: {
          start: { line: 3 },
          end: { line: 5 },
        },
      },
    }),
  ).toBe(false)

  expect(
    isInlineCode({
      className: "",
      children: "line1\nline2",
    }),
  ).toBe(false)
})
