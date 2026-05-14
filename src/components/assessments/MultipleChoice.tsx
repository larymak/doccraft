import React, { useState } from 'react'
import type { Assessment, MultipleChoiceData } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { scoreMultipleChoice } from '@/lib/rubric'
import styles from './MultipleChoice.module.css'

export interface MultipleChoiceProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
}

export function MultipleChoice({ assessment, onComplete }: MultipleChoiceProps) {
  const data = assessment.data as MultipleChoiceData
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  if (!data?.options?.length) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No question data available.</p>
      </div>
    )
  }

  const score = submitted && selectedId ? scoreMultipleChoice(selectedId, data.options) : 0
  const isCorrect = score === 100
  const xpEarned = submitted ? Math.round((score / 100) * assessment.xpReward) : 0

  function handleSubmit() {
    if (!selectedId) return
    setSubmitted(true)
  }

  function handleContinue() {
    if (!selectedId) return
    const attempt: AssessmentAttempt = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      score,
      xpEarned,
      attempts: 1,
      passed: score >= assessment.masteryThreshold,
      debtReduced: score >= assessment.masteryThreshold ? assessment.debtReduction : 0,
      submittedData: { selectedId },
    }
    onComplete(attempt)
  }

  return (
    <div className={styles.container}>
      <p className={styles.question}>{data.question}</p>

      <div className={styles.options}>
        {data.options.map((opt, optIdx) => {
          let optClass = styles.option
          if (submitted) {
            optClass += ` ${styles['option--disabled']}`
            if (opt.isCorrect) optClass += ` ${styles['option--correct']}`
            else if (opt.id === selectedId && !opt.isCorrect) optClass += ` ${styles['option--incorrect']}`
          } else if (opt.id === selectedId) {
            optClass += ` ${styles['option--selected']}`
          }

          const showInner = (!submitted && opt.id === selectedId) || (submitted && opt.isCorrect) || (submitted && opt.id === selectedId)

          return (
            <button
              key={opt.id}
              className={optClass}
              style={{ '--option-delay': `${optIdx * 80}ms` } as React.CSSProperties}
              onClick={() => !submitted && setSelectedId(opt.id)}
              disabled={submitted}
              aria-pressed={opt.id === selectedId}
            >
              <span className={styles.radioIndicator}>
                {showInner && <span className={styles.radioInner} />}
              </span>
              <span className={styles.optionText}>
                {opt.text}
                {submitted && (
                  <span className={styles.explanation}>{opt.explanation}</span>
                )}
              </span>
              {submitted && opt.isCorrect && (
                <span className={`${styles.optionBadge} ${styles.badgeCorrect}`}>Correct</span>
              )}
              {submitted && !opt.isCorrect && opt.id === selectedId && (
                <span className={`${styles.optionBadge} ${styles.badgeIncorrect}`}>Wrong</span>
              )}
            </button>
          )
        })}
      </div>

      {submitted ? (
        <>
          <div className={`${styles.result} ${isCorrect ? styles['result--correct'] : styles['result--incorrect']}`}>
            <span className={styles.resultIcon}>{isCorrect ? '✓' : '✗'}</span>
            <div className={styles.resultText}>
              <p className={styles.resultTitle}>{isCorrect ? 'Correct!' : 'Not quite.'}</p>
              <p className={styles.resultSub}>
                Score: <strong>{score}/100</strong>&nbsp;&nbsp;
                <span className={styles.xpTag}>+{xpEarned} XP</span>
              </p>
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
            className={styles.checkBtn}
            onClick={handleSubmit}
            disabled={!selectedId}
          >
            Check Answer
          </button>
        </div>
      )}
    </div>
  )
}
