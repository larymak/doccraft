import React, { useMemo } from 'react'
import type { DocAsset } from '@/types/content'
import styles from './FileTree.module.css'

export interface FileTreeProps {
  docs: DocAsset[]
  selectedDocId: string | null
  onSelect: (docId: string) => void
}

function getFolder(filename: string): string {
  const parts = filename.replace(/^\//, '').split('/')
  if (parts.length > 1) return parts[0]
  // Infer from filename prefix patterns like "engineering-foo.md"
  const dash = filename.indexOf('-')
  if (dash > 0 && dash < 16) return filename.slice(0, dash)
  return 'general'
}

function healthDotClass(trustScore: number): string {
  if (trustScore >= 70) return styles['healthDot--green']
  if (trustScore >= 40) return styles['healthDot--yellow']
  return styles['healthDot--red']
}

export function FileTree({ docs, selectedDocId, onSelect }: FileTreeProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, DocAsset[]>()
    for (const doc of docs ?? []) {
      const folder = getFolder(doc.filename)
      const existing = map.get(folder) ?? []
      existing.push(doc)
      map.set(folder, existing)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [docs])

  if (!docs?.length) {
    return (
      <div className={styles.tree}>
        <p style={{ color: 'var(--fcc-gray-400)', fontSize: 'var(--text-sm)', fontStyle: 'italic', padding: 'var(--space-2)' }}>
          No documents available.
        </p>
      </div>
    )
  }

  return (
    <nav className={styles.tree} aria-label="Document tree">
      {grouped.map(([folder, folderDocs]) => (
        <div key={folder} className={styles.folder}>
          <div className={styles.folderLabel}>
            <span className={styles.folderIcon}>▸</span>
            <span>{folder}/</span>
          </div>
          <div className={styles.folderFiles}>
            {folderDocs.map(doc => (
              <button
                key={doc.id}
                className={`${styles.fileItem} ${doc.id === selectedDocId ? styles['fileItem--selected'] : ''}`}
                onClick={() => onSelect(doc.id)}
                title={doc.filename}
                aria-selected={doc.id === selectedDocId}
              >
                <span className={`${styles.healthDot} ${healthDotClass(doc.trustScore)}`} />
                <span className={styles.fileName}>
                  {doc.filename.split('/').pop() ?? doc.filename}
                </span>
                <span className={styles.fileScore}>{doc.trustScore}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
