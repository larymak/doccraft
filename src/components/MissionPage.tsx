import React, { useEffect, useState } from 'react'
import { Providers } from '@/context/Providers'
import { useApp } from '@/context/AppContext'
import { useGame } from '@/context/GameContext'
import { useMission } from '@/context/MissionContext'
import { DebtMeter } from '@/components/game/DebtMeter'
import { DebtDelta } from '@/components/game/DebtDelta'
import { AssessmentRouter } from '@/components/assessments/AssessmentRouter'
import { Modal } from '@/components/ui/Modal'
import { CharacterDialog } from '@/components/ui/CharacterDialog'
import { startMission } from '@/lib/storage'
import { getMissionStatus } from '@/lib/progression'
import type { Mission, Unit, DocAsset, RubricItem } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import styles from './MissionPage.module.css'

interface MissionPageProps {
  mission: Mission
  unit: Unit
  allUnits: Unit[]
  allMissions: Mission[]
}

function FileTree({
  materials,
  selectedId,
  onSelect,
}: {
  materials: DocAsset[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (materials.length === 0) {
    return <p className={styles.noMaterials}>No materials for this mission.</p>
  }

  return (
    <ul className={styles.fileTree}>
      {materials.map(doc => (
        <li
          key={doc.id}
          className={[styles.fileItem, selectedId === doc.id ? styles.activeFile : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onSelect(doc.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && onSelect(doc.id)}
          aria-label={`Open ${doc.filename}`}
        >
          <span className={styles.fileIcon}>&#128196;</span>
          {doc.filename}
        </li>
      ))}
    </ul>
  )
}

function MetadataPanel({ doc }: { doc: DocAsset }) {
  const entries = Object.entries(doc.frontmatter ?? {})
  if (entries.length === 0) return null

  return (
    <div className={styles.metaPanel}>
      {entries.map(([k, v]) => (
        <div key={k} className={styles.metaRow}>
          <span className={styles.metaKey}>{k}</span>
          <span className={styles.metaVal}>{String(v)}</span>
        </div>
      ))}
    </div>
  )
}

function DocViewer({ doc }: { doc: DocAsset }) {
  return (
    <div className={styles.docViewer}>
      <div className={styles.docViewerHeader}>
        <span className={styles.docFilename}>{doc.filename}</span>
        <div className={styles.docScores}>
          <span className={styles.docScore}>
            Trust: <span>{doc.trustScore}</span>
          </span>
          <span className={styles.docScore}>
            Find: <span>{doc.findabilityScore}</span>
          </span>
        </div>
      </div>
      <div className={styles.docBody}>{doc.body}</div>
      {doc.issues && doc.issues.length > 0 && (
        <div className={styles.docIssues}>
          <p className={styles.docIssuesTitle}>Issues Detected</p>
          <ul className={styles.docIssuesList}>
            {doc.issues.map((issue, idx) => (
              <li key={idx} className={styles.docIssueItem}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function RubricPanel({ rubric }: { rubric: RubricItem[] }) {
  return (
    <div className={styles.rubricSection}>
      <p className={styles.rubricTitle}>Grading Rubric</p>
      <ul className={styles.rubricList}>
        {rubric.map(item => (
          <li key={item.id} className={styles.rubricItem}>
            <span className={styles.rubricItemLabel}>{item.label}</span>
            <span>{item.description}</span>
            {' '}
            <span className={styles.rubricWeight}>({item.weight}%)</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MissionInner({ mission, unit, allUnits, allMissions }: MissionPageProps) {
  const { userProgress, isLoading, isOnboarded } = useApp()
  const { knowledgeDebt, reduceDebt, addXP, awardBadge } = useGame()
  const { currentAssessmentIndex, assessmentResults, isComplete, submitAssessment, completeMissionFlow } =
    useMission()

  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    mission.materials[0]?.id ?? null,
  )
  const [showBrief, setShowBrief] = useState(false)
  const [showDebtDelta, setShowDebtDelta] = useState(false)
  const [lastDebtReduced, setLastDebtReduced] = useState(0)
  const [revisitDismissed, setRevisitDismissed] = useState(false)

  const missionStatus =
    userProgress !== null
      ? getMissionStatus(mission.id, mission.unitId, userProgress, allMissions, allUnits)
      : 'available'
  const missionLocked = missionStatus === 'locked'
  const missionPreviouslyCompleted = missionStatus === 'completed' && !revisitDismissed

  useEffect(() => {
    if (!isLoading && !isOnboarded) {
      window.location.href = '/onboarding'
      return
    }
    if (!isLoading && isOnboarded && missionLocked) {
      window.location.href = '/map'
      return
    }
    // Show brief if not seen
    const briefKey = `seen_brief_${mission.id}`
    if (!localStorage.getItem(briefKey)) {
      setShowBrief(true)
      localStorage.setItem(briefKey, '1')
    }
    // Start mission
    startMission(mission.id, mission.unitId)
  }, [isLoading, isOnboarded, missionLocked, mission.id, mission.unitId])

  const selectedDoc = mission.materials.find(d => d.id === selectedDocId) ?? null

  const currentAssessment = mission.assessments[currentAssessmentIndex] ?? null

  function handleAssessmentComplete(attempt: AssessmentAttempt) {
    if (attempt.debtReduced > 0) {
      reduceDebt(attempt.debtReduced)
      addXP(attempt.xpEarned)
      setLastDebtReduced(attempt.debtReduced)
      setShowDebtDelta(true)
    } else {
      addXP(attempt.xpEarned)
    }
    submitAssessment(attempt)

    // Check if all assessments done
    if (currentAssessmentIndex + 1 >= mission.assessments.length) {
      completeMissionFlow(mission.id, mission.unitId)
      if (mission.id === unit.bossMissionId) {
        awardBadge(unit.badge.id, unit.id)
      }
    }
  }

  function handleProceedAfterComplete() {
    if (mission.gitWorkflow) {
      window.location.href = `/git-sim/${mission.slug}`
    } else {
      window.location.href = `/results/${mission.slug}`
    }
  }

  const currentRubric =
    currentAssessment?.rubric ??
    (currentAssessment?.data && 'rubric' in currentAssessment.data
      ? (currentAssessment.data as { rubric?: RubricItem[] }).rubric
      : undefined)

  if (isLoading) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerRing} aria-label="Loading..." />
      </div>
    )
  }

  if (!userProgress) return null

  return (
    <div className={styles.page}>
      {/* Mission brief modal */}
      <Modal
        isOpen={showBrief}
        onClose={() => setShowBrief(false)}
        title={mission.title}
        size="lg"
      >
        <div className={styles.briefModal}>
          <CharacterDialog
            name="Jordan"
            role="Engineering Manager"
            message={mission.scenario}
            avatarColor="#4a6fa5"
            className={styles.briefDialog}
          />
          <p className={styles.objectivesLabel}>Objectives</p>
          <ul className={styles.objectivesList}>
            {mission.objectives.map((obj, idx) => (
              <li key={idx} className={styles.objectiveItem}>
                {obj}
              </li>
            ))}
          </ul>
          <div className={styles.modalStartBtn}>
            <button
              type="button"
              className={styles.completionBtn}
              onClick={() => setShowBrief(false)}
            >
              Start Mission →
            </button>
          </div>
        </div>
      </Modal>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.missionTitle}>{mission.title}</h1>
          <span className={styles.unitName}>
            Unit {unit.order}: {unit.title}
          </span>
        </div>
        <div className={styles.topBarRight}>
          <DebtMeter debt={knowledgeDebt} compact />
          <a href="/map" className={styles.backLink}>
            ← Map
          </a>
        </div>
      </div>

      {/* Revisit banner */}
      {missionPreviouslyCompleted && (
        <div className={styles.revisitBanner}>
          <span className={styles.revisitIcon}>✓</span>
          <div className={styles.revisitText}>
            <strong>You've completed this mission.</strong>
            <span> Review the materials or try the tasks again.</span>
          </div>
          <div className={styles.revisitActions}>
            <button
              type="button"
              className={styles.revisitRetryBtn}
              onClick={() => setRevisitDismissed(true)}
            >
              Retry tasks
            </button>
            <a href={`/results/${mission.slug}`} className={styles.revisitResultsBtn}>
              See results
            </a>
          </div>
        </div>
      )}

      {/* Assessment progress */}
      {!isComplete && !missionPreviouslyCompleted && (
        <div className={styles.assessmentProgress}>
          <div className={styles.progressPips}>
            {mission.assessments.map((_, idx) => (
              <div
                key={idx}
                className={[
                  styles.pip,
                  idx < currentAssessmentIndex ? styles.done : '',
                  idx === currentAssessmentIndex ? styles.current : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>
          <span>
            Task {Math.min(currentAssessmentIndex + 1, mission.assessments.length)} of{' '}
            {mission.assessments.length}
          </span>
        </div>
      )}

      {/* Layout */}
      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {mission.materials.length > 0 && (
            <div className={styles.sidebarSection}>
              <p className={styles.sidebarHeading}>Materials</p>
              <FileTree
                materials={mission.materials}
                selectedId={selectedDocId}
                onSelect={setSelectedDocId}
              />
            </div>
          )}

          {selectedDoc &&
            selectedDoc.frontmatter &&
            Object.keys(selectedDoc.frontmatter).length > 0 && (
              <div className={styles.sidebarSection}>
                <p className={styles.sidebarHeading}>Frontmatter</p>
                <MetadataPanel doc={selectedDoc} />
              </div>
            )}
        </aside>

        {/* Main content */}
        <div className={styles.main}>
          {selectedDoc ? (
            <DocViewer doc={selectedDoc} />
          ) : (
            <div className={styles.scenarioDoc}>
              <h2 className={styles.scenarioTitle}>Mission Brief</h2>
              <p className={styles.scenarioText}>{mission.scenario}</p>
            </div>
          )}

          {!isComplete && !missionPreviouslyCompleted && currentAssessment && (
            <div className={styles.assessmentSection}>
              <AssessmentRouter
                assessment={currentAssessment}
                onComplete={handleAssessmentComplete}
                missionId={mission.id}
              />
            </div>
          )}

          {!isComplete && !missionPreviouslyCompleted && currentAssessment && currentRubric && currentRubric.length > 0 && (
            <RubricPanel rubric={currentRubric} />
          )}

          {isComplete && (
            <div className={styles.completionBanner}>
              <div className={styles.completionIcon}>&#10003;</div>
              <h2 className={styles.completionTitle}>All Tasks Complete!</h2>
              <p className={styles.completionSub}>
                {mission.gitWorkflow
                  ? 'Review your documentation changes in the Git workflow.'
                  : 'Head to your results to see your score.'}
              </p>
              <button
                type="button"
                className={styles.completionBtn}
                onClick={handleProceedAfterComplete}
              >
                {mission.gitWorkflow ? 'Review Git Changes →' : 'See Results →'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debt delta overlay */}
      {showDebtDelta && lastDebtReduced > 0 && (
        <div className={styles.debtDeltaWrapper}>
          <DebtDelta amount={lastDebtReduced} onComplete={() => setShowDebtDelta(false)} />
        </div>
      )}
    </div>
  )
}

export function MissionPage(props: MissionPageProps) {
  return (
    <Providers>
      <MissionInner {...props} />
    </Providers>
  )
}

