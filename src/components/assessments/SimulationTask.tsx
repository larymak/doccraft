import React, { useState } from 'react'
import type {
  Assessment,
  SimulationData,
  SimulationPhase,
  MultipleChoiceData,
  WritingData,
  MetadataEditData,
  ReviewData,
  SortingData,
} from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { AIFeedbackPanel } from '@/components/workspace/AIFeedbackPanel'
import { MultipleChoice } from './MultipleChoice'
import { WritingTask } from './WritingTask'
import { MetadataEditTask } from './MetadataEditTask'
import { ReviewTask } from './ReviewTask'
import { SortingTask } from './SortingTask'
import styles from './SimulationTask.module.css'

export interface SimulationTaskProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
  missionId: string
}

interface PhaseScore {
  phaseId: string
  score: number
  xpEarned: number
}

function PhaseComponent({
  phase,
  onPhaseDone,
}: {
  phase: SimulationPhase
  onPhaseDone: (attempt: AssessmentAttempt) => void
}) {
  // Build a synthetic Assessment from the SimulationPhase
  const syntheticAssessment: Assessment = {
    id: phase.id,
    type: phase.assessmentType,
    title: phase.title,
    description: phase.description,
    data: phase.data,
    hints: [],
    xpReward: phase.xpReward,
    masteryThreshold: 70,
    debtReduction: 0,
  }

  switch (phase.assessmentType) {
    case 'multiple-choice':
      return (
        <MultipleChoice
          assessment={{ ...syntheticAssessment, data: phase.data as MultipleChoiceData }}
          onComplete={onPhaseDone}
        />
      )
    case 'writing':
      return (
        <WritingTask
          assessment={{ ...syntheticAssessment, data: phase.data as WritingData }}
          onComplete={onPhaseDone}
        />
      )
    case 'metadata-edit':
      return (
        <MetadataEditTask
          assessment={{ ...syntheticAssessment, data: phase.data as MetadataEditData }}
          onComplete={onPhaseDone}
        />
      )
    case 'review':
      return (
        <ReviewTask
          assessment={{ ...syntheticAssessment, data: phase.data as ReviewData }}
          onComplete={onPhaseDone}
        />
      )
    case 'sorting':
      return (
        <SortingTask
          assessment={{ ...syntheticAssessment, data: phase.data as SortingData }}
          onComplete={onPhaseDone}
        />
      )
    default:
      return (
        <p style={{ color: 'var(--fcc-gray-400)' }}>
          Phase type "{phase.assessmentType}" not yet supported in simulation.
        </p>
      )
  }
}

export function SimulationTask({ assessment, onComplete, missionId }: SimulationTaskProps) {
  const data = assessment.data as SimulationData
  const phases = data?.phases ?? []

  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [phaseScores, setPhaseScores] = useState<PhaseScore[]>([])
  const [phaseAnswers, setPhaseAnswers] = useState<Array<{ phaseId: string; answer: string }>>([])
  const [allPhasesComplete, setAllPhasesComplete] = useState(false)
  const [aiFeedbackDone, setAIFeedbackDone] = useState(false)

  const showAIFeedback = missionId === 'u10-m01' && allPhasesComplete

  if (!phases.length) {
    return (
      <div className={styles.container}>
        <p style={{ color: 'var(--fcc-gray-400)' }}>No simulation phases defined.</p>
      </div>
    )
  }

  const currentPhase = phases[currentPhaseIndex]

  function handlePhaseDone(attempt: AssessmentAttempt) {
    const newScore: PhaseScore = {
      phaseId: attempt.assessmentId,
      score: attempt.score,
      xpEarned: attempt.xpEarned,
    }
    const updatedScores = [...phaseScores, newScore]
    setPhaseScores(updatedScores)

    // Capture the submitted text for AI feedback
    const submittedText =
      typeof attempt.submittedData === 'object' &&
      attempt.submittedData !== null &&
      'text' in attempt.submittedData
        ? String((attempt.submittedData as { text: string }).text)
        : JSON.stringify(attempt.submittedData ?? '')

    setPhaseAnswers(prev => [
      ...prev,
      { phaseId: attempt.assessmentId, answer: submittedText },
    ])

    if (currentPhaseIndex + 1 >= phases.length) {
      setAllPhasesComplete(true)
    } else {
      setCurrentPhaseIndex(prev => prev + 1)
    }
  }

  function handleComplete() {
    const totalScore =
      phaseScores.length > 0
        ? Math.round(phaseScores.reduce((sum, s) => sum + s.score, 0) / phaseScores.length)
        : 0
    const totalXP = phaseScores.reduce((sum, s) => sum + s.xpEarned, 0)
    const passed = totalScore >= assessment.masteryThreshold

    const attempt: AssessmentAttempt = {
      assessmentId: assessment.id,
      completedAt: new Date().toISOString(),
      score: totalScore,
      xpEarned: totalXP,
      attempts: 1,
      passed,
      debtReduced: passed ? assessment.debtReduction : 0,
      submittedData: { phaseScores, phaseAnswers },
    }
    onComplete(attempt)
  }

  return (
    <div className={styles.container}>
      {/* Scenario briefing */}
      {(data.scenario || data.briefing) && (
        <div className={styles.briefing}>
          <div className={styles.briefingTitle}>Scenario Briefing</div>
          <p className={styles.briefingText}>{data.briefing || data.scenario}</p>
        </div>
      )}

      {/* Phase progress indicator */}
      <div className={styles.phaseProgress}>
        <div className={styles.phaseProgressLabel}>
          Phase {Math.min(currentPhaseIndex + 1, phases.length)} of {phases.length}
        </div>
        <div className={styles.phaseSteps}>
          {phases.map((phase, i) => {
            const isDone = i < currentPhaseIndex || (allPhasesComplete && i <= currentPhaseIndex)
            const isActive = i === currentPhaseIndex && !allPhasesComplete
            const stepClass = isDone
              ? styles['phaseStep--done']
              : isActive
              ? styles['phaseStep--active']
              : styles['phaseStep--pending']

            return (
              <div key={phase.id} className={`${styles.phaseStep} ${stepClass}`}>
                <span className={styles.phaseIcon}>{isDone ? '✓' : isActive ? '▶' : '○'}</span>
                <span>{phase.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* All phases complete: show scores, AI feedback, and complete button */}
      {allPhasesComplete ? (
        <div className={styles.phaseContent}>
          <div className={styles.scoresSummary}>
            <div className={styles.phaseProgressLabel}>Phase Results</div>
            {phaseScores.map((ps, i) => (
              <div key={ps.phaseId} className={styles.scoreItem}>
                <span className={styles.scoreItemPhase}>
                  Phase {i + 1}: {phases[i]?.title ?? ps.phaseId}
                </span>
                <span className={styles.scoreItemValue}>{ps.score}</span>
              </div>
            ))}
          </div>

          {phaseScores.length > 0 && (
            <div className={styles.finalScore}>
              <div className={styles.finalScoreLabel}>Average Score</div>
              <div className={styles.finalScoreNumber}>
                {Math.round(phaseScores.reduce((s, p) => s + p.score, 0) / phaseScores.length)}
              </div>
              <div className={styles.finalScoreSub}>
                Total XP: +{phaseScores.reduce((s, p) => s + p.xpEarned, 0)}
              </div>
            </div>
          )}

          {showAIFeedback && (
            <AIFeedbackPanel
              missionId={missionId}
              phaseAnswers={phaseAnswers}
              aiPromptTemplate={data.aiPromptTemplate ?? ''}
              onComplete={() => setAIFeedbackDone(true)}
            />
          )}

          {(!showAIFeedback || aiFeedbackDone) && (
            <button className={styles.completeBtn} onClick={handleComplete}>
              Complete Mission
            </button>
          )}
        </div>
      ) : (
        /* Active phase */
        <div className={styles.phaseContent}>
          <div className={styles.phaseHeader}>
            <span className={styles.phaseNumber}>Phase {currentPhaseIndex + 1}</span>
          </div>
          <h3 className={styles.phaseTitle}>{currentPhase.title}</h3>
          {currentPhase.description && (
            <p className={styles.phaseDescription}>{currentPhase.description}</p>
          )}
          <PhaseComponent phase={currentPhase} onPhaseDone={handlePhaseDone} />
        </div>
      )}
    </div>
  )
}
