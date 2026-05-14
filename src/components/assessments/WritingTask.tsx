import React, { useState, useMemo, useRef, useCallback } from 'react'
import { marked } from 'marked'
import type { Assessment, WritingData } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { evaluateWritingRubric } from '@/lib/rubric'
import { RubricPanel } from '@/components/workspace/RubricPanel'
import styles from './WritingTask.module.css'

export interface WritingTaskProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function WritingTask({ assessment, onComplete }: WritingTaskProps) {
  const data = assessment.data as WritingData
  const [text, setText] = useState(data?.docTemplate ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [evalResult, setEvalResult] = useState<ReturnType<typeof evaluateWritingRubric> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = useMemo(() => countWords(text), [text])
  const minWords = data?.wordCountMin ?? 0
  const isUnderMin = minWords > 0 && wordCount < minWords

  const preview = useMemo(() => {
    try {
      return marked.parse(text) as string
    } catch {
      return text
    }
  }, [text])

  const rubric = data?.rubric ?? assessment.rubric ?? []

  const rubricResults = evalResult
    ? evalResult.results.map(r => ({ id: r.id, passed: r.passed }))
    : undefined

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = textareaRef.current
      if (!el) return
      const start = el.selectionStart
      const end = el.selectionEnd
      const newVal = text.slice(0, start) + '  ' + text.slice(end)
      setText(newVal)
      // Restore cursor after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = start + 2
        el.selectionEnd = start + 2
      })
    }
  }, [text])

  function handleSubmit() {
    const result = evaluateWritingRubric(text, rubric, data?.acceptedPatterns)
    setEvalResult(result)
    setSubmitted(true)
  }

  function handleContinue() {
    if (!evalResult) return
    const xpEarned = Math.round((evalResult.score / 100) * assessment.xpReward)
    const attempt: AssessmentAttempt = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      score: evalResult.score,
      xpEarned,
      attempts: 1,
      passed: evalResult.passed,
      debtReduced: evalResult.passed ? assessment.debtReduction : 0,
      submittedData: { text },
    }
    onComplete(attempt)
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No writing task data available.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {data.scenarioContext && (
        <p className={styles.scenario}>{data.scenarioContext}</p>
      )}

      <div className={styles.editorLayout}>
        <div className={styles.editorPane}>
          <div className={styles.paneLabel}>Markdown Editor</div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={submitted}
            placeholder="Write your documentation here..."
            spellCheck
          />
          <span className={`${styles.wordCount} ${isUnderMin ? styles['wordCount--warn'] : ''}`}>
            {wordCount} words{minWords > 0 ? ` / ${minWords} minimum` : ''}
          </span>
        </div>

        <div className={styles.previewPane}>
          <div className={styles.paneLabel}>Preview</div>
          <div
            className={styles.preview}
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      </div>

      {rubric.length > 0 && (
        <div className={styles.rubricSection}>
          <div className={styles.rubricTitle}>Rubric</div>
          <RubricPanel rubric={rubric} results={rubricResults} />
        </div>
      )}

      {submitted && evalResult ? (
        <>
          <div className={`${styles.scoreBanner} ${evalResult.passed ? styles['scoreBanner--pass'] : styles['scoreBanner--fail']}`}>
            <div className={styles.scoreNumber}>{evalResult.score}</div>
            <div className={styles.scoreSub}>
              {evalResult.passed ? 'Passed' : 'Needs improvement'}&nbsp;&nbsp;
              <span className={styles.xpTag}>+{Math.round((evalResult.score / 100) * assessment.xpReward)} XP</span>
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
            disabled={isUnderMin}
            title={isUnderMin ? `Need at least ${minWords} words` : undefined}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
