import React, { useState } from 'react'
import styles from './CommitForm.module.css'

interface CommitFormProps {
  hints: string[]
  onCommit: (message: string) => void
}

const BANNED_ALONE = ['update', 'fix', 'wip', 'changes', 'stuff']

function validate(msg: string): string | null {
  const trimmed = msg.trim()
  if (trimmed.length < 10) return 'Commit message must be at least 10 characters.'
  if (BANNED_ALONE.includes(trimmed.toLowerCase())) {
    return 'Be more descriptive — avoid vague messages like "update" or "fix".'
  }
  return null
}

export function CommitForm({ hints, onCommit }: CommitFormProps) {
  const [message, setMessage] = useState('')
  const [committed, setCommitted] = useState(false)
  const [committedMessage, setCommittedMessage] = useState('')
  const [touched, setTouched] = useState(false)

  const error = touched ? validate(message) : null
  const isValid = validate(message) === null

  function handleSubmit() {
    if (!isValid) return
    const msg = message.trim()
    setCommittedMessage(msg)
    setCommitted(true)
    onCommit(msg)
  }

  if (committed) {
    return (
      <div className={styles.success}>
        <span className={styles.successIcon}>&#10003;</span>
        <div className={styles.successText}>
          <span className={styles.successLabel}>Committed</span>
          <code className={styles.successMessage}>{committedMessage}</code>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <div>
        <label htmlFor="commit-msg" className={styles.label}>
          Commit Message
        </label>
        <textarea
          id="commit-msg"
          className={[styles.textarea, touched && error ? styles.invalid : ''].filter(Boolean).join(' ')}
          value={message}
          placeholder="Add a descriptive commit message..."
          onChange={e => setMessage(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={4}
        />
        <div className={styles.charCount + (message.trim().length >= 10 ? ' ' + styles.ok : '')}>
          {message.trim().length} characters
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {hints.length > 0 && (
        <div className={styles.hintsSection}>
          <p className={styles.hintsTitle}>Writing Tips</p>
          <ul className={styles.hintList}>
            {hints.map((hint, i) => (
              <li key={i} className={styles.hintItem}>
                <span className={styles.hintCheck} aria-hidden="true">&#9679;</span>
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.submitRow}>
        <button
          type="button"
          className={styles.submitBtn}
          disabled={!isValid}
          onClick={handleSubmit}
        >
          Commit Changes
        </button>
      </div>
    </div>
  )
}
