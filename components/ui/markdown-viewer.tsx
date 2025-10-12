import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import rehypeHighlight from "rehype-highlight"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import "highlight.js/styles/github-dark.css"

interface MarkdownViewerProps {
  content: string
  className?: string
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div className={cn("prose prose-sm max-w-none dark:prose-invert break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
        components={{
          a({ node, children, href, ...props }) {
            const isExternal = href?.startsWith('http')
            return (
              <a 
                href={href} 
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1"
                {...props}
              >
                {children}
                {isExternal && <ExternalLink className="h-3 w-3 inline-block" />}
              </a>
            )
          },
          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code className={cn(className, "block")} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
