"use client"

import * as React from "react"
import { Bold, Italic, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableFormatting?: boolean
}

function applyFormatting(textarea: HTMLTextAreaElement | null, formatType: "bold" | "italic" | "list"): void {
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = textarea.value.substring(start, end)

  if (!selectedText) return

  let formattedText = ""
  let cursorOffset = 0

  switch (formatType) {
    case "bold":
      formattedText = `*${selectedText}*`
      cursorOffset = 2
      break
    case "italic":
      formattedText = `_${selectedText}_`
      cursorOffset = 2
      break
    case "list":
      formattedText = selectedText
        .split("\n")
        .map((line) => (line.trim() ? `• ${line}` : line))
        .join("\n")
      cursorOffset = 0
      break
  }

  const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end)

  // Atualizar o valor do textarea
  textarea.value = newValue

  // Disparar evento de input para atualizar o estado React
  const event = new Event("input", { bubbles: true })
  textarea.dispatchEvent(event)

  // Restaurar o foco e posicionar o cursor após a formatação
  textarea.focus()
  textarea.setSelectionRange(end + cursorOffset, end + cursorOffset)
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableFormatting = true, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

    // Combinar refs
    React.useEffect(() => {
      if (typeof ref === "function") {
        ref(textareaRef.current)
      } else if (ref) {
        ref.current = textareaRef.current
      }
    }, [ref])

    return (
      <div className="flex flex-col w-full">
        {enableFormatting && (
          <div className="flex items-center gap-1 p-2 border rounded-t-md bg-muted/30 border-input">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting(textareaRef.current, "bold")}
            >
              <Bold className="h-4 w-4" />
              <span className="sr-only">Negrito</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting(textareaRef.current, "italic")}
            >
              <Italic className="h-4 w-4" />
              <span className="sr-only">Itálico</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => applyFormatting(textareaRef.current, "list")}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Lista</span>
            </Button>
          </div>
        )}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            enableFormatting && "rounded-t-none border-t-0",
            className,
          )}
          ref={textareaRef}
          {...props}
        />
      </div>
    )
  },
)
Textarea.displayName = "Textarea"

export { Textarea }

