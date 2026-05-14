import React, { useState } from 'react'
import styles from './DiffViewer.module.css'

interface DiffFile {
  filename: string
  before: string
  after: string
}

interface DiffViewerProps {
  files: DiffFile[]
}

function DiffColumn({
  content,
  side,
}: {
  content: string
  side: 'before' | 'after'
}) {
  const lines = content.split('\n')

  return (
    <div className={[styles.diffColumn, side === 'before' ? styles.beforeCol : styles.afterCol].join(' ')}>
      {lines.map((line, idx) => (
        <div
          key={idx}
          className={[
            styles.diffLine,
            side === 'before' ? styles.removed : styles.added,
          ].join(' ')}
        >
          <span className={styles.lineNum}>{idx + 1}</span>
          <span className={styles.lineContent}>{line || ' '}</span>
        </div>
      ))}
    </div>
  )
}

export function DiffViewer({ files }: DiffViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!files || files.length === 0) {
    return <div className={styles.empty}>No files to display.</div>
  }

  const active = files[activeIndex]

  return (
    <div className={styles.viewer}>
      {files.length > 1 && (
        <div className={styles.tabs} role="tablist">
          {files.map((file, idx) => (
            <button
              key={file.filename}
              role="tab"
              aria-selected={idx === activeIndex}
              className={[styles.tab, idx === activeIndex ? styles.active : ''].filter(Boolean).join(' ')}
              onClick={() => setActiveIndex(idx)}
            >
              {file.filename}
            </button>
          ))}
        </div>
      )}

      <div className={styles.diffPanel}>
        <div className={styles.diffHeader}>
          <div className={[styles.diffColLabel, styles.before].join(' ')}>
            Before — {active.filename}
          </div>
          <div className={[styles.diffColLabel, styles.after].join(' ')}>
            After — {active.filename}
          </div>
        </div>

        <div className={styles.diffBody}>
          <DiffColumn content={active.before} side="before" />
          <DiffColumn content={active.after} side="after" />
        </div>
      </div>
    </div>
  )
}
