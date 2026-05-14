import React, { useState } from 'react'
import { completeMission, setGitSimComplete } from '@/lib/storage'
import styles from './MergeConfirmation.module.css'

interface MergeConfirmationProps {
  disabled: boolean
  onMerge: () => void
  missionId: string
  unitId: string
}

type MergeState = 'idle' | 'merging' | 'merged'

export function MergeConfirmation({ disabled, onMerge, missionId, unitId }: MergeConfirmationProps) {
  const [state, setState] = useState<MergeState>('idle')

  function handleMerge() {
    if (disabled || state !== 'idle') return
    setState('merging')

    setTimeout(() => {
      completeMission(missionId, unitId, 100)
      setGitSimComplete(missionId, unitId)
      setState('merged')
      onMerge()

      setTimeout(() => {
        window.location.href = `/results/${missionId}`
      }, 800)
    }, 1500)
  }

  if (state === 'merged') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.mergedState}>
          <div className={styles.mergedIcon}>&#10003;</div>
          <p className={styles.mergedLabel}>Pull Request Merged!</p>
          <p className={styles.mergedSub}>Redirecting to your results...</p>
        </div>
      </div>
    )
  }

  if (state === 'merging') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.mergeSpinner} aria-label="Merging..." />
        <p className={styles.mergingText}>Merging pull request...</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.prCard}>
        <h3 className={styles.prTitle}>Documentation Update</h3>
        <p className={styles.prMeta}>
          {disabled
            ? 'Complete the PR checklist before merging.'
            : 'All checks passed. Ready to merge.'}
        </p>
      </div>

      <button
        type="button"
        className={styles.mergeBtn}
        disabled={disabled}
        onClick={handleMerge}
        aria-disabled={disabled}
      >
        <span>&#8627;</span>
        Merge Pull Request
      </button>

      {disabled && (
        <p className={styles.disabledNote}>
          Complete all checklist items to enable merge.
        </p>
      )}
    </div>
  )
}
