"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Code, 
  List, 
  ListOrdered,
  Heading2,
  Quote,
  Eye,
  Edit3
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  id?: string
  className?: string
  error?: boolean
  maxLength?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Напишите что-нибудь...",
  rows = 10,
  id,
  className,
  error,
  maxLength
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write")
  
  const insertMarkdown = (before: string, after: string = "") => {
    const textareaId = id || "markdown-editor"
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement
    if (!textarea) {
      console.warn(`Textarea with id "${textareaId}" not found`)
      return
    }

    const start = textarea.selectionStart || 0
    const end = textarea.selectionEnd || 0
    const selectedText = value.substring(start, end)
    
    // Build new text with markdown syntax
    const beforeText = value.substring(0, start)
    const afterText = value.substring(end)
    const newText = beforeText + before + selectedText + after + afterText
    
    // Update value
    onChange(newText)
    
    // Restore focus and cursor position after DOM update
    requestAnimationFrame(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })
  }

  const toolbarButtons = [
    { icon: Bold, label: "Жирный", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "Курсив", action: () => insertMarkdown("*", "*") },
    { icon: Heading2, label: "Заголовок", action: () => insertMarkdown("## ", "") },
    { icon: Quote, label: "Цитата", action: () => insertMarkdown("> ", "") },
    { icon: Code, label: "Код", action: () => insertMarkdown("`", "`") },
    { icon: LinkIcon, label: "Ссылка", action: () => insertMarkdown("[", "](url)") },
    { icon: List, label: "Список", action: () => insertMarkdown("- ", "") },
    { icon: ListOrdered, label: "Нумерованный список", action: () => insertMarkdown("1. ", "") },
  ]

  return (
    <div className={`${className}`}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
        <div className="flex items-center justify-between mb-3 relative z-20">
          <Label htmlFor={id || "markdown-editor"} className="text-sm font-semibold cursor-pointer">Содержание</Label>
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="write" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Edit3 className="h-3.5 w-3.5" />
              Написать
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Eye className="h-3.5 w-3.5" />
              Просмотр
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="write" className="space-y-0 mt-0 relative z-10">
          <div className={`rounded-lg border ${error ? "border-destructive" : "border-input"} overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0`}>
            <div className="flex flex-wrap gap-1 p-2 bg-muted/20 backdrop-blur-sm border-b">
              {toolbarButtons.map((btn, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    btn.action()
                  }}
                  title={btn.label}
                  tabIndex={-1}
                >
                  <btn.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Textarea
              id={id || "markdown-editor"}
              value={value}
              onChange={(e) => {
                const newValue = e.target.value
                onChange(maxLength ? newValue.slice(0, maxLength) : newValue)
              }}
              placeholder={placeholder}
              rows={rows}
              className="resize-none rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className={`min-h-[${rows * 24}px] p-4 border rounded-lg bg-muted/10 ${error ? "border-destructive" : "border-input"}`}>
            {value ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    a({ href, children, ...props }) {
                      const isExternal = href?.startsWith('http')
                      return (
                        <a 
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                          {...props}
                        >
                          {children}
                        </a>
                      )
                    }
                  }}
                >
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Предпросмотр появится здесь...
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-1">
        <span className={`text-xs ${value.length > (maxLength || Infinity) ? "text-destructive" : "text-muted-foreground"}`}>
          {value.length}{maxLength ? `/${maxLength}` : ""}
        </span>
      </div>
    </div>
  )
}
