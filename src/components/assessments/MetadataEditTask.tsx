import React, { useState, useCallback } from 'react'
import type { Assessment, MetadataEditData, MetadataValidationRule } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { evaluateMetadataRubric } from '@/lib/rubric'
import styles from './MetadataEditTask.module.css'

export interface MetadataEditTaskProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
}

type FieldValidState = 'idle' | 'valid' | 'invalid'

function isArrayField(key: string): boolean {
  return key === 'tags' || key === 'audience' || key === 'authors' || key === 'keywords'
}

function parseFieldValue(key: string, raw: string): unknown {
  if (isArrayField(key)) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return raw
}

function displayFieldValue(key: string, value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined) return ''
  return String(value)
}

function validateField(
  key: string,
  rawValue: string,
  rules: MetadataValidationRule[],
  isRequired: boolean,
): { state: FieldValidState; message: string } {
  const value = parseFieldValue(key, rawValue)

  const fieldRules = rules.filter(r => r.field === key)

  if (isRequired && (rawValue.trim() === '' || (Array.isArray(value) && value.length === 0))) {
    return { state: 'invalid', message: `"${key}" is required` }
  }

  for (const rule of fieldRules) {
    if (rule.rule === 'required') {
      if (rawValue.trim() === '') return { state: 'invalid', message: rule.feedback }
    } else if (rule.rule === 'non-empty') {
      if (rawValue.trim() === '' || (Array.isArray(value) && value.length === 0)) {
        return { state: 'invalid', message: rule.feedback }
      }
    } else if (rule.rule === 'one-of') {
      const allowed = Array.isArray(rule.value) ? rule.value : [String(rule.value)]
      if (!allowed.includes(rawValue.trim())) {
        return { state: 'invalid', message: rule.feedback }
      }
    } else if (rule.rule === 'matches-pattern') {
      try {
        const regex = new RegExp(typeof rule.value === 'string' ? rule.value : '')
        if (!regex.test(rawValue.trim())) {
          return { state: 'invalid', message: rule.feedback }
        }
      } catch {
        return { state: 'invalid', message: rule.feedback }
      }
    }
  }

  if (rawValue.trim() === '' && !isRequired) return { state: 'idle', message: '' }
  return { state: 'valid', message: '' }
}

export function MetadataEditTask({ assessment, onComplete }: MetadataEditTaskProps) {
  const data = assessment.data as MetadataEditData

  const allFields = [
    ...data.requiredFields,
    ...data.optionalFields.filter(f => !data.requiredFields.includes(f)),
  ]

  const initialValues: Record<string, string> = {}
  for (const key of allFields) {
    const existing = data.initialFrontmatter[key]
    initialValues[key] = displayFieldValue(key, existing)
  }

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(initialValues)
  const [submitted, setSubmitted] = useState(false)
  const [evalResult, setEvalResult] = useState<ReturnType<typeof evaluateMetadataRubric> | null>(null)

  const getValidation = useCallback(
    (key: string): { state: FieldValidState; message: string } => {
      const rawValue = fieldValues[key] ?? ''
      const isRequired = data.requiredFields.includes(key)
      if (rawValue.trim() === '' && !isRequired) return { state: 'idle', message: '' }
      return validateField(key, rawValue, data.validationRules, isRequired)
    },
    [fieldValues, data.requiredFields, data.validationRules],
  )

  function handleChange(key: string, val: string) {
    setFieldValues(prev => ({ ...prev, [key]: val }))
  }

  function handleSubmit() {
    const frontmatter: Record<string, unknown> = {}
    for (const key of allFields) {
      frontmatter[key] = parseFieldValue(key, fieldValues[key] ?? '')
    }
    const result = evaluateMetadataRubric(
      frontmatter,
      data.requiredFields,
      data.validationRules,
    )
    setEvalResult(result)
    setSubmitted(true)
  }

  function handleContinue() {
    if (!evalResult) return
    const attempt: AssessmentAttempt = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      score: evalResult.score,
      xpEarned: Math.round((evalResult.score / 100) * assessment.xpReward),
      attempts: 1,
      passed: evalResult.passed,
      debtReduced: evalResult.passed ? assessment.debtReduction : 0,
      submittedData: { fieldValues },
    }
    onComplete(attempt)
  }

  if (!data?.requiredFields) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No metadata task data available.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {data.scenarioContext && (
        <p className={styles.scenario}>{data.scenarioContext}</p>
      )}

      <div className={styles.editorCard}>
        <div className={styles.editorHeader}>
          <span className={styles.fmBrace}>---</span>
          <span>frontmatter editor</span>
          <span className={styles.fmBrace}>---</span>
        </div>

        <div className={styles.fields}>
          {data.requiredFields.map(key => {
            const validation = getValidation(key)
            return (
              <div key={key} className={styles.fieldRow}>
                <label className={styles.fieldLabel}>
                  {key}:
                  <span className={styles.required}> *</span>
                </label>
                <input
                  type="text"
                  value={fieldValues[key] ?? ''}
                  onChange={e => handleChange(key, e.target.value)}
                  disabled={submitted}
                  placeholder={isArrayField(key) ? 'comma, separated, values' : `Enter ${key}`}
                  className={[
                    styles.fieldInput,
                    validation.state === 'valid' ? styles['fieldInput--valid'] : '',
                    validation.state === 'invalid' ? styles['fieldInput--invalid'] : '',
                  ].filter(Boolean).join(' ')}
                />
                {isArrayField(key) && (
                  <span className={styles.fieldHint}>Separate multiple values with commas</span>
                )}
                {validation.state !== 'idle' && !submitted && (
                  <span className={`${styles.validationMsg} ${validation.state === 'valid' ? styles['validationMsg--valid'] : styles['validationMsg--invalid']}`}>
                    <span className={styles.validIcon}>
                      {validation.state === 'valid' ? '✓' : '✗'}
                    </span>
                    {validation.message || 'Looks good'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {data.optionalFields.length > 0 && (
          <div className={styles.optionalSection}>
            <div className={styles.optionalTitle}>Optional fields</div>
            <div className={styles.fields} style={{ padding: 0 }}>
              {data.optionalFields.map(key => {
                const validation = getValidation(key)
                return (
                  <div key={key} className={styles.fieldRow}>
                    <label className={styles.fieldLabel}>{key}:</label>
                    <input
                      type="text"
                      value={fieldValues[key] ?? ''}
                      onChange={e => handleChange(key, e.target.value)}
                      disabled={submitted}
                      placeholder={isArrayField(key) ? 'comma, separated, values' : `Enter ${key}`}
                      className={[
                        styles.fieldInput,
                        validation.state === 'valid' ? styles['fieldInput--valid'] : '',
                        validation.state === 'invalid' ? styles['fieldInput--invalid'] : '',
                      ].filter(Boolean).join(' ')}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {submitted && evalResult ? (
        <>
          <div className={`${styles.scoreBanner} ${evalResult.passed ? styles['scoreBanner--pass'] : styles['scoreBanner--fail']}`}>
            <div className={styles.scoreNumber}>{evalResult.score}</div>
            <div className={styles.scoreSub}>
              {evalResult.passed ? 'Passed' : 'Not yet passing'} — threshold {assessment.masteryThreshold}
            </div>
          </div>
          <div className={styles.results}>
            {evalResult.results.map(r => (
              <div
                key={r.id}
                className={`${styles.resultItem} ${r.passed ? styles['resultItem--pass'] : styles['resultItem--fail']}`}
              >
                <span className={styles.resultItemIcon}>{r.passed ? '✓' : '✗'}</span>
                <div>
                  <div className={styles.resultItemField}>{r.label}</div>
                  <div className={styles.resultItemFeedback}>{r.feedback}</div>
                </div>
              </div>
            ))}
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
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
