import React, { useMemo, useRef, useCallback } from 'react'
import { marked } from 'marked'
import styles from './MarkdownEditor.module.css'

export interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  minHeight?: number
  placeholder?: string
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function MarkdownEditor({
  value,
  onChange,
  minHeight = 320,
  placeholder = 'Write markdown here...',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const preview = useMemo(() => {
    try {
      return marked.parse(value) as string
    } catch {
      return value
    }
  }, [value])

  const wordCount = useMemo(() => countWords(value), [value])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const newVal = value.slice(0, start) + '  ' + value.slice(end)
        onChange(newVal)
        requestAnimationFrame(() => {
          el.selectionStart = start + 2
          el.selectionEnd = start + 2
        })
      }
    },
    [value, onChange],
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles.paneLabel}>Markdown</div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ minHeight }}
            spellCheck
          />
          <span className={styles.wordCount}>{wordCount} words</span>
        </div>

        <div className={styles.pane}>
          <div className={styles.paneLabel}>Preview</div>
          <div
            className={styles.preview}
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>
    </div>
  )
}
