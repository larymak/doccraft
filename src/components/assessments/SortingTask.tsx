import React, { useState } from 'react'
import type { Assessment, SortingData, SortingItem } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { scoreSorting } from '@/lib/rubric'
import styles from './SortingTask.module.css'

export interface SortingTaskProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
}

export function SortingTask({ assessment, onComplete }: SortingTaskProps) {
  const data = assessment.data as SortingData

  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  if (!data?.items?.length || !data?.categories?.length) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No sorting data available.</p>
      </div>
    )
  }

  const unassigned = data.items.filter(item => !(item.id in placements))
  const score = submitted ? scoreSorting(placements, data.items) : 0
  const xpEarned = submitted ? Math.round((score / 100) * assessment.xpReward) : 0
  const passed = score >= assessment.masteryThreshold
  const assignedCount = Object.keys(placements).length
  const correctCount = submitted
    ? data.items.filter(item => placements[item.id] === item.categoryId).length
    : 0

  // ── Click-to-assign ──────────────────────────────────────────────────────

  function handleItemClick(item: SortingItem) {
    if (submitted) return
    setSelectedItemId(prev => (prev === item.id ? null : item.id))
  }

  function handleCategoryClick(categoryId: string) {
    if (submitted || !selectedItemId) return
    setPlacements(prev => ({ ...prev, [selectedItemId]: categoryId }))
    setSelectedItemId(null)
  }

  function handleRemoveFromCategory(itemId: string) {
    if (submitted) return
    setPlacements(prev => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
    setSelectedItemId(null)
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, itemId: string) {
    setDraggedItemId(itemId)
    setSelectedItemId(null)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', itemId)
  }

  function handleDragEnd() {
    setDraggedItemId(null)
    setDragOverCatId(null)
  }

  function handleCategoryDragOver(e: React.DragEvent, catId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCatId(catId)
  }

  function handleCategoryDragLeave(e: React.DragEvent) {
    // Only clear if leaving the category container itself
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setDragOverCatId(null)
  }

  function handleCategoryDrop(e: React.DragEvent, catId: string) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (itemId && !submitted) {
      setPlacements(prev => ({ ...prev, [itemId]: catId }))
    }
    setDraggedItemId(null)
    setDragOverCatId(null)
  }

  // Allow dragging items back out of a category into the unassigned panel
  function handleUnassignedDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCatId('__unassigned__')
  }

  function handleUnassignedDragLeave(e: React.DragEvent) {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setDragOverCatId(null)
  }

  function handleUnassignedDrop(e: React.DragEvent) {
    e.preventDefault()
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId
    if (itemId && !submitted) {
      handleRemoveFromCategory(itemId)
    }
    setDraggedItemId(null)
    setDragOverCatId(null)
  }

  // ── Submit / continue ────────────────────────────────────────────────────

  function handleSubmit() {
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
      submittedData: { placements },
    }
    onComplete(attempt)
  }

  function getItemState(item: SortingItem) {
    if (!submitted) {
      if (item.id === selectedItemId || item.id === draggedItemId) return 'selected'
      return 'default'
    }
    return placements[item.id] === item.categoryId ? 'correct' : 'incorrect'
  }

  return (
    <div className={styles.container}>
      <p className={styles.instructions}>{data.instruction}</p>

      {!submitted && (
        <div className={styles.scoreBar}>
          <span className={styles.scoreLabel}>Assigned:</span>
          <span className={styles.scoreValue}>{assignedCount} / {data.items.length}</span>
          {selectedItemId && (
            <span style={{ color: 'var(--fcc-gold)', fontSize: 'var(--text-sm)' }}>
              Item selected — click a category to place it
            </span>
          )}
        </div>
      )}

      <div className={styles.layout}>
        {/* Unassigned items panel */}
        <div
          className={[
            styles.unassignedPanel,
            dragOverCatId === '__unassigned__' ? styles['panel--dragover'] : '',
          ].filter(Boolean).join(' ')}
          onDragOver={!submitted ? handleUnassignedDragOver : undefined}
          onDragLeave={!submitted ? handleUnassignedDragLeave : undefined}
          onDrop={!submitted ? handleUnassignedDrop : undefined}
        >
          <div className={styles.panelLabel}>Items to sort</div>
          {unassigned.length === 0 ? (
            <p style={{ color: 'var(--fcc-gray-400)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
              All items placed
            </p>
          ) : (
            unassigned.map(item => {
              const state = getItemState(item)
              return (
                <button
                  key={item.id}
                  draggable={!submitted}
                  className={[
                    styles.item,
                    state === 'selected' ? styles['item--selected'] : '',
                    item.id === draggedItemId ? styles['item--dragging'] : '',
                    submitted ? styles['item--disabled'] : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleItemClick(item)}
                  onDragStart={e => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                >
                  <span className={styles.dragHandle} aria-hidden>⠿</span>
                  {item.text}
                </button>
              )
            })
          )}
        </div>

        {/* Category drop zones */}
        <div className={styles.categories}>
          {data.categories.map(cat => {
            const catItems = data.items.filter(item => placements[item.id] === cat.id)
            const isClickActive = !submitted && selectedItemId !== null
            const isDragOver = dragOverCatId === cat.id

            return (
              <div
                key={cat.id}
                className={[
                  styles.category,
                  isClickActive ? styles['category--active'] : '',
                  isDragOver ? styles['category--dragover'] : '',
                  submitted ? styles['category--disabled'] : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleCategoryClick(cat.id)}
                onDragOver={!submitted ? e => handleCategoryDragOver(e, cat.id) : undefined}
                onDragLeave={!submitted ? handleCategoryDragLeave : undefined}
                onDrop={!submitted ? e => handleCategoryDrop(e, cat.id) : undefined}
                role="region"
                aria-label={cat.label}
              >
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryName}>{cat.label}</div>
                  {cat.description && (
                    <div className={styles.categoryDesc}>{cat.description}</div>
                  )}
                </div>
                <div className={styles.categoryItems}>
                  {catItems.length === 0 ? (
                    <span className={styles.emptyHint}>Drag or click to place items here</span>
                  ) : (
                    catItems.map(item => {
                      const state = getItemState(item)
                      return (
                        <button
                          key={item.id}
                          draggable={!submitted}
                          className={[
                            styles.item,
                            state === 'correct' ? styles['item--correct'] : '',
                            state === 'incorrect' ? styles['item--incorrect'] : '',
                            state === 'selected' ? styles['item--selected'] : '',
                            item.id === draggedItemId ? styles['item--dragging'] : '',
                            submitted ? styles['item--disabled'] : '',
                          ].filter(Boolean).join(' ')}
                          onClick={e => {
                            e.stopPropagation()
                            if (!submitted) handleRemoveFromCategory(item.id)
                          }}
                          onDragStart={e => {
                            e.stopPropagation()
                            handleDragStart(e, item.id)
                          }}
                          onDragEnd={handleDragEnd}
                        >
                          {!submitted && <span className={styles.dragHandle} aria-hidden>⠿</span>}
                          {item.text}
                          {submitted && (
                            <span className={styles.itemExplanation}>{item.explanation}</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {submitted ? (
        <>
          <div className={`${styles.resultBanner} ${passed ? styles['resultBanner--pass'] : styles['resultBanner--fail']}`}>
            <span className={styles.resultIcon}>{passed ? '✓' : '✗'}</span>
            <div>
              <p className={styles.resultTitle}>
                {correctCount} / {data.items.length} correct — Score: {score}
              </p>
              <p className={styles.resultSub}>
                {passed ? 'Great work!' : 'Keep practicing.'}
                &nbsp;&nbsp;<span className={styles.xpTag}>+{xpEarned} XP</span>
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
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={assignedCount < data.items.length}
          >
            Submit ({assignedCount}/{data.items.length} placed)
          </button>
        </div>
      )}
    </div>
  )
}
