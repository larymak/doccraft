import React, { useState } from 'react'
import type { Assessment, ReviewData, ReviewCommentPrompt } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { scoreReview } from '@/lib/rubric'
import styles from './ReviewTask.module.css'

export interface ReviewTaskProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
}

type ReviewAction = 'approve' | 'request-changes' | 'comment'

interface UserAction {
  action: ReviewAction | null
  comment: string
}

interface DiffLineProps {
  lineNum: number
  text: string
  type: 'removed' | 'added' | 'unchanged'
}

function DiffLine({ lineNum, text, type }: DiffLineProps) {
  const marker = type === 'removed' ? '-' : type === 'added' ? '+' : ' '
  return (
    <li className={`${styles.diffLine} ${type !== 'unchanged' ? styles[`diffLine--${type}`] : styles['diffLine--unchanged']}`}>
      <span className={styles.lineNum}>{lineNum}</span>
      <span className={`${styles.lineMarker} ${type !== 'unchanged' ? styles[`lineMarker--${type}`] : ''}`}>
        {marker}
      </span>
      <span className={styles.lineText}>{text}</span>
    </li>
  )
}

function FileDiff({ filename, before, after }: { filename: string; before: string; after: string }) {
  const beforeLines = before ? before.split('\n') : []
  const afterLines = after ? after.split('\n') : []

  return (
    <div className={styles.fileBlock}>
      <div className={styles.fileBlockHeader}>
        <span className={styles.fileIcon}>📄</span>
        <span>{filename}</span>
      </div>
      <div className={styles.diffGrid}>
        <div className={styles.diffPane}>
          <div className={`${styles.diffPaneLabel} ${styles['diffPaneLabel--before']}`}>Before</div>
          <ul className={styles.diffLines}>
            {beforeLines.map((line, i) => (
              <DiffLine key={i} lineNum={i + 1} text={line} type="removed" />
            ))}
          </ul>
        </div>
        <div className={styles.diffPane}>
          <div className={`${styles.diffPaneLabel} ${styles['diffPaneLabel--after']}`}>After</div>
          <ul className={styles.diffLines}>
            {afterLines.map((line, i) => (
              <DiffLine key={i} lineNum={i + 1} text={line} type="added" />
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function ReviewTask({ assessment, onComplete }: ReviewTaskProps) {
  const data = assessment.data as ReviewData

  const initialActions: Record<string, UserAction> = {}
  for (const prompt of data?.reviewCommentPrompts ?? []) {
    initialActions[prompt.id] = { action: null, comment: '' }
  }

  const [userActions, setUserActions] = useState<Record<string, UserAction>>(initialActions)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  if (!data?.reviewCommentPrompts) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No review data available.</p>
      </div>
    )
  }

  const allAnswered = data.reviewCommentPrompts.every(p => userActions[p.id]?.action !== null)
  const xpEarned = submitted ? Math.round((score / 100) * assessment.xpReward) : 0
  const passed = score >= assessment.masteryThreshold

  function setAction(promptId: string, action: ReviewAction) {
    setUserActions(prev => ({
      ...prev,
      [promptId]: { ...prev[promptId], action },
    }))
  }

  function setComment(promptId: string, comment: string) {
    setUserActions(prev => ({
      ...prev,
      [promptId]: { ...prev[promptId], comment },
    }))
  }

  function handleSubmit() {
    const actionsForScoring: Record<string, { action: string; comment?: string }> = {}
    for (const [id, ua] of Object.entries(userActions)) {
      actionsForScoring[id] = {
        action: ua.action ?? '',
        comment: ua.comment,
      }
    }
    const computed = scoreReview(actionsForScoring, data.reviewCommentPrompts)
    setScore(computed)
    setSubmitted(true)
  }

  function handleContinue() {
    const attempt: AssessmentAttempt = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      score,
      xpEarned,
      attempts: 1,
      passed,
      debtReduced: passed ? assessment.debtReduction : 0,
      submittedData: { userActions },
    }
    onComplete(attempt)
  }

  function promptResultClass(prompt: ReviewCommentPrompt): string {
    if (!submitted) return styles.prompt
    const userAction = userActions[prompt.id]?.action
    if (userAction === prompt.correctAction) return `${styles.prompt} ${styles['prompt--correct']}`
    return `${styles.prompt} ${styles['prompt--incorrect']}`
  }

  return (
    <div className={styles.container}>
      {/* PR Header */}
      <div className={styles.prHeader}>
        <h2 className={styles.prTitle}>{data.pullRequestTitle}</h2>
        {data.prDescription && (
          <p className={styles.prDescription}>{data.prDescription}</p>
        )}
      </div>

      {/* File diffs */}
      {data.changedFiles?.length > 0 && (
        <div>
          <div className={styles.sectionTitle}>Changed Files ({data.changedFiles.length})</div>
          <div className={styles.fileChanges}>
            {data.changedFiles.map((f, i) => (
              <FileDiff
                key={i}
                filename={f.filename}
                before={f.before}
                after={f.after}
              />
            ))}
          </div>
        </div>
      )}

      {/* Review prompts */}
      <div>
        <div className={styles.sectionTitle}>Review Questions</div>
        <div className={styles.prompts}>
          {data.reviewCommentPrompts.map(prompt => {
            const ua = userActions[prompt.id]
            const isCorrect = submitted && ua?.action === prompt.correctAction

            return (
              <div key={prompt.id} className={promptResultClass(prompt)}>
                {prompt.lineRef && (
                  <span className={styles.promptRef}>{prompt.lineRef}</span>
                )}
                <p className={styles.promptQuestion}>{prompt.question}</p>

                <div className={styles.actionButtons}>
                  {(['approve', 'request-changes', 'comment'] as ReviewAction[]).map(action => {
                    const label =
                      action === 'approve'
                        ? 'Approve'
                        : action === 'request-changes'
                        ? 'Request Changes'
                        : 'Comment'
                    const modCls =
                      action === 'approve'
                        ? styles['actionBtn--approve']
                        : action === 'request-changes'
                        ? styles['actionBtn--request']
                        : styles['actionBtn--comment']

                    return (
                      <button
                        key={action}
                        className={[
                          styles.actionBtn,
                          modCls,
                          ua?.action === action ? styles['actionBtn--selected'] : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => !submitted && setAction(prompt.id, action)}
                        disabled={submitted}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {(ua?.action === 'comment' || ua?.action === 'request-changes') && (
                  <textarea
                    className={styles.commentInput}
                    value={ua.comment}
                    onChange={e => setComment(prompt.id, e.target.value)}
                    disabled={submitted}
                    placeholder="Add your comment..."
                  />
                )}

                {submitted && (
                  <div className={styles.promptExplanation}>
                    <strong style={{ color: isCorrect ? 'var(--fcc-green)' : 'var(--fcc-red)' }}>
                      {isCorrect ? '✓ Correct' : `✗ Correct action: ${prompt.correctAction}`}
                    </strong>
                    <br />
                    {prompt.explanation}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {submitted ? (
        <>
          <div className={`${styles.scoreBanner} ${passed ? styles['scoreBanner--pass'] : styles['scoreBanner--fail']}`}>
            <div className={styles.scoreNumber}>{score}</div>
            <div className={styles.scoreSub}>
              {passed ? 'Passed' : 'Needs review'}&nbsp;&nbsp;
              <span className={styles.xpTag}>+{xpEarned} XP</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.continueBtn} onClick={handleContinue}>
              Continue
            </button>
          </div>
        </>
      ) : (
        <div className={styles.actions}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!allAnswered}
          >
            Submit Review
          </button>
        </div>
      )}
    </div>
  )
}
