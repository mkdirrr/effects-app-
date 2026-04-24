import React, { useMemo } from 'react'
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

/**
 * MarkdownRenderer — Renders Markdown content to styled HTML.
 * Used in AI chat messages and Pro Notes viewer.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return ''
    try {
      // Basic sanitization — strip script tags
      const sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      return marked.parse(sanitized)
    } catch {
      return content
    }
  }, [content])

  return (
    <div
      className={`markdown-body ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
