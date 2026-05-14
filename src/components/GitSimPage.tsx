import React, { useState, useEffect } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { DiffViewer } from '@/components/git/DiffViewer'
import { CommitForm } from '@/components/git/CommitForm'
import { PRChecklist } from '@/components/git/PRChecklist'
import { ReviewerComments } from '@/components/git/ReviewerComments'
import { MergeConfirmation } from '@/components/git/MergeConfirmation'
import type { Mission } from '@/types/content'
import styles from './GitSimPage.module.css'

interface GitSimPageProps {
  mission: Mission
}

const STEPS = [
  { id: 1, label: 'View Changes' },
  { id: 2, label: 'Commit' },
  { id: 3, label: 'PR Checklist' },
  { id: 4, label: 'Review' },
  { id: 5, label: 'Merge' },
]

const STEP_DESCS: Record<number, { title: string; desc: string }> = {
  1: {
    title: 'Review File Changes',
    desc: 'Inspect what changed in each documentation file. Understand the before and after for each edit.',
  },
  2: {
    title: 'Write a Commit Message',
    desc: 'Describe what you changed and why. A good commit message helps reviewers understand the intent.',
  },
  3: {
    title: 'Complete the PR Checklist',
    desc: 'Before requesting a review, confirm that all quality checks are satisfied.',
  },
  4: {
    title: 'Reviewer Feedback',
    desc: 'The documentation reviewer has left comments on your pull request. Read their feedback.',
  },
  5: {
    title: 'Merge Pull Request',
    desc: 'All checks are complete. Merge your changes to publish the improved documentation.',
  },
}

function GitSimInner({ mission }: GitSimPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const [currentStep, setCurrentStep] = useState(1)
  const [checklistDone, setChecklistDone] = useState(false)

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
    }
  }, [isLoading, isOnboarded])

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading..." />
      </div>
    )
  }

  if (!userProgress || !mission.gitWorkflow) return null

  const gw = mission.gitWorkflow

  function advanceStep() {
    setCurrentStep(s => Math.min(s + 1, 5))
  }

  const info = STEP_DESCS[currentStep]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Git Review</h1>
            <p className={styles.missionLabel}>{mission.title}</p>
          </div>
          <a href={`/mission/${mission.slug}`} className={styles.backLink}>
            &larr; Mission
          </a>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {STEPS.map((step, idx) => {
            const isDone = step.id < currentStep
            const isCurrent = step.id === currentStep
            return (
              <React.Fragment key={step.id}>
                <div className={styles.step}>
                  <div
                    className={[
                      styles.stepDot,
                      isDone ? styles.done : '',
                      isCurrent ? styles.current : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isDone ? '✓' : step.id}
                  </div>
                  <span
                    className={[
                      styles.stepLabel,
                      isDone ? styles.done : '',
                      isCurrent ? styles.current : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={[styles.stepConnector, isDone ? styles.done : '']
                      .filter(Boolean)
                      .join(' ')}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>{info.title}</h2>
        <p className={styles.panelDesc}>{info.desc}</p>

        {currentStep === 1 && (
          <>
            <DiffViewer files={gw.changedFiles} />
            <div className={styles.nextBtn}>
              <button type="button" className={styles.nextBtnEl} onClick={advanceStep}>
                Looks Good &rarr;
              </button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <CommitForm
            hints={gw.commitMessageHints}
            onCommit={() => setTimeout(advanceStep, 600)}
          />
        )}

        {currentStep === 3 && (
          <PRChecklist
            items={gw.prChecklistItems}
            onAllChecked={() => {
              setChecklistDone(true)
            }}
          />
        )}

        {currentStep === 3 && checklistDone && (
          <div className={styles.nextBtn}>
            <button type="button" className={styles.nextBtnEl} onClick={advanceStep}>
              Submit for Review &rarr;
            </button>
          </div>
        )}

        {currentStep === 4 && (
          <>
            <ReviewerComments comments={gw.reviewerComments} />
            <div className={styles.nextBtn}>
              <button type="button" className={styles.nextBtnEl} onClick={advanceStep}>
                Ready to Merge &rarr;
              </button>
            </div>
          </>
        )}

        {currentStep === 5 && (
          <MergeConfirmation
            disabled={false}
            onMerge={() => {}}
            missionId={mission.id}
            unitId={mission.unitId}
          />
        )}
      </div>
    </div>
  )
}

export function GitSimPage(props: GitSimPageProps) {
  return (
    <Providers>
      <GitSimInner {...props} />
    </Providers>
  )
}
