import React, { useCallback } from 'react'
import styles from './MetadataPanel.module.css'

export interface MetadataPanelProps {
  frontmatter: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  requiredFields?: string[]
  readOnly?: boolean
}

function isArrayValue(val: unknown): boolean {
  return Array.isArray(val)
}

function displayValue(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ')
  if (val === null || val === undefined) return ''
  return String(val)
}

function parseValue(key: string, raw: string, original: unknown): unknown {
  if (isArrayValue(original)) {
    return raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  }
  return raw
}

function validateField(
  key: string,
  raw: string,
  isRequired: boolean,
): { state: 'valid' | 'invalid' | 'idle'; message: string } {
  if (!isRequired && raw.trim() === '') return { state: 'idle', message: '' }
  if (isRequired && raw.trim() === '') return { state: 'invalid', message: `${key} is required` }
  return { state: 'valid', message: '' }
}

export function MetadataPanel({
  frontmatter,
  onChange,
  requiredFields = [],
  readOnly = false,
}: MetadataPanelProps) {
  const keys = Object.keys(frontmatter)

  const handleChange = useCallback(
    (key: string, rawVal: string) => {
      const original = frontmatter[key]
      onChange(key, parseValue(key, rawVal, original))
    },
    [frontmatter, onChange],
  )

  if (!keys.length) {
    return (
      <div className={styles.panel}>
        <p style={{ color: 'var(--fcc-gray-400)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
          No metadata fields.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      {keys.map(key => {
        const value = frontmatter[key]
        const rawStr = displayValue(value)
        const isRequired = requiredFields.includes(key)
        const validation = validateField(key, rawStr, isRequired)

        return (
          <div key={key} className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              {key}:
              {isRequired && <span className={styles.required}> *</span>}
            </label>

            {readOnly ? (
              <div className={styles.readOnlyValue}>{rawStr || '—'}</div>
            ) : (
              <>
                <input
                  type="text"
                  value={rawStr}
                  onChange={e => handleChange(key, e.target.value)}
                  className={[
                    styles.input,
                    validation.state === 'valid' ? styles['input--valid'] : '',
                    validation.state === 'invalid' ? styles['input--invalid'] : '',
                  ].filter(Boolean).join(' ')}
                  placeholder={isArrayValue(value) ? 'comma, separated, values' : `Enter ${key}`}
                />
                {validation.state !== 'idle' && (
                  <div className={`${styles.validationRow} ${validation.state === 'valid' ? styles['validationRow--valid'] : styles['validationRow--invalid']}`}>
                    <span>{validation.state === 'valid' ? '✓' : '✗'}</span>
                    <span>{validation.message || 'Looks good'}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
