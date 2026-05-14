import React, { useState, useEffect } from 'react'
import {
  getAIFeedback,
  getCachedFeedback,
  cacheFeedback,
  type AIFeedbackResult,
  type PhaseAnswer,
} from '@/lib/claude-api'
import styles from './AIFeedbackPanel.module.css'

export interface AIFeedbackPanelProps {
  missionId: string
  phaseAnswers: Array<{ phaseId: string; answer: string }>
  aiPromptTemplate: string
  onComplete?: () => void
}

type PanelState = 'idle' | 'loading' | 'success' | 'error'

export function AIFeedbackPanel({
  missionId,
  phaseAnswers,
  aiPromptTemplate,
  onComplete,
}: AIFeedbackPanelProps) {
  const [state, setState] = useState<PanelState>('idle')
  const [feedback, setFeedback] = useState<AIFeedbackResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // On mount: check localStorage cache
  useEffect(() => {
    const cached = getCachedFeedback(missionId)
    if (cached) {
      setFeedback(cached)
      setState('success')
    }
  }, [missionId])

  async function requestFeedback() {
    setState('loading')
    setErrorMsg('')
    try {
      const result = await getAIFeedback(
        aiPromptTemplate,
        phaseAnswers as PhaseAnswer[],
      )
      cacheFeedback(missionId, result)
      setFeedback(result)
      setState('success')
    } catch (err) {
      console.error('[AIFeedbackPanel] Failed to get feedback:', err)
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please try again.',
      )
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <div className={styles.panel}>
        <button className={styles.requestBtn} onClick={requestFeedback}>
          <span className={styles.requestBtnIcon}>✦</span>
          Request AI Feedback
        </button>
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className={styles.panel}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} aria-hidden="true" />
          <p className={styles.loadingText}>Analyzing your documentation work…</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className={styles.panel}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>
            Could not load AI feedback: {errorMsg}
          </p>
          <button className={styles.retryBtn} onClick={requestFeedback}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!feedback) return null

  return (
    <div className={styles.panel}>
      <div className={styles.feedbackCard}>
        <div className={styles.feedbackHeader}>
          <span className={styles.aiIcon}>✦</span>
          <div className={styles.feedbackHeaderText}>
            <p className={styles.feedbackTitle}>AI Documentation Coach Feedback</p>
            <p className={styles.feedbackSub}>Powered by Claude</p>
          </div>
          <div className={styles.overallScore}>
            <span className={styles.scoreLabel}>Overall</span>
            <span className={styles.scoreNumber}>{feedback.overallScore}</span>
          </div>
        </div>

        <div className={styles.feedbackBody}>
          {/* Strengths */}
          {feedback.strengths.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Strengths</div>
              {feedback.strengths.map((s, i) => (
                <div key={i} className={styles.strength}>
                  <span className={styles.strengthIcon}>✓</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}

          {/* Issues */}
          {feedback.issues.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Issues to Address</div>
              {feedback.issues.map((issue, i) => (
                <div key={i} className={`${styles.issue} ${styles[`issue--${issue.severity}`]}`}>
                  <div className={styles.issueHeader}>
                    <span className={`${styles.issueSeverity} ${styles[`issueSeverity--${issue.severity}`]}`}>
                      {issue.severity}
                    </span>
                    {issue.phase && issue.phase !== 'general' && (
                      <span className={styles.issuePhase}>{issue.phase}</span>
                    )}
                  </div>
                  <p className={styles.issueMessage}>{issue.message}</p>
                  {issue.suggestion && (
                    <p className={styles.issueSuggestion}>{issue.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Revision prompt */}
          {feedback.revisionPrompt && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Revision Guidance</div>
              <p className={styles.revisionPrompt}>{feedback.revisionPrompt}</p>
            </div>
          )}
        </div>
      </div>

      {onComplete && (
        <button className={styles.continueBtn} onClick={onComplete}>
          Continue
        </button>
      )}
    </div>
  )
}
