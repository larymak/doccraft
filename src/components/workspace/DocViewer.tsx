import React, { useMemo } from 'react'
import { marked } from 'marked'
import type { DocAsset } from '@/types/content'
import styles from './DocViewer.module.css'

export interface DocViewerProps {
  doc: DocAsset
  className?: string
}

function trustBarClass(score: number): string {
  if (score >= 70) return styles['scoreBarFill--trust-high']
  if (score >= 40) return styles['scoreBarFill--trust-mid']
  return styles['scoreBarFill--trust-low']
}

function findBarClass(score: number): string {
  if (score >= 70) return styles['scoreBarFill--find-high']
  if (score >= 40) return styles['scoreBarFill--find-mid']
  return styles['scoreBarFill--find-low']
}

export function DocViewer({ doc, className }: DocViewerProps) {
  const htmlBody = useMemo(() => {
    if (!doc?.body) return ''
    try {
      return marked.parse(doc.body) as string
    } catch {
      return doc.body
    }
  }, [doc?.body])

  if (!doc) {
    return (
      <div style={{ color: 'var(--fcc-gray-400)', padding: 'var(--space-4)' }}>
        No document selected.
      </div>
    )
  }

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      {/* Main content column */}
      <div className={styles.mainCol}>
        <div className={styles.docHeader}>
          <span className={styles.filename}>{doc.filename}</span>
        </div>
        {doc.title && <h1 className={styles.docTitle}>{doc.title}</h1>}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: htmlBody }}
        />
      </div>

      {/* Sidebar: scores + issues */}
      <div className={styles.sidebar}>
        <div className={styles.scoreCard}>
          <div className={styles.scoreTitle}>Document Health</div>

          <div className={styles.scoreRow}>
            <div className={styles.scoreLabel}>
              <span>Trust Score</span>
              <span className={styles.scoreValue}>{doc.trustScore}</span>
            </div>
            <div className={styles.scoreBar}>
              <div
                className={`${styles.scoreBarFill} ${trustBarClass(doc.trustScore)}`}
                style={{ width: `${Math.min(100, Math.max(0, doc.trustScore))}%` }}
              />
            </div>
          </div>

          <div className={styles.scoreRow}>
            <div className={styles.scoreLabel}>
              <span>Findability</span>
              <span className={styles.scoreValue}>{doc.findabilityScore}</span>
            </div>
            <div className={styles.scoreBar}>
              <div
                className={`${styles.scoreBarFill} ${findBarClass(doc.findabilityScore)}`}
                style={{ width: `${Math.min(100, Math.max(0, doc.findabilityScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Issues */}
        <div className={styles.issuesCard}>
          <div className={styles.issuesTitle}>
            Issues ({doc.issues?.length ?? 0})
          </div>
          {doc.issues?.length ? (
            doc.issues.map((issue, i) => (
              <div key={i} className={styles.issueItem}>
                <span className={styles.issueIcon}>⚠</span>
                <span>{issue}</span>
              </div>
            ))
          ) : (
            <span className={styles.noIssues}>No issues found</span>
          )}
        </div>
      </div>
    </div>
  )
}
