import React from 'react'
import type { Assessment } from '@/types/content'
import type { AssessmentAttempt } from '@/types/progress'
import { MultipleChoice } from './MultipleChoice'
import { SortingTask } from './SortingTask'
import { MetadataEditTask } from './MetadataEditTask'
import { WritingTask } from './WritingTask'
import { ReviewTask } from './ReviewTask'
import { SimulationTask } from './SimulationTask'

export interface AssessmentRouterProps {
  assessment: Assessment
  onComplete: (attempt: AssessmentAttempt) => void
  missionId?: string
}

export function AssessmentRouter({ assessment, onComplete, missionId = '' }: AssessmentRouterProps) {
  switch (assessment.type) {
    case 'multiple-choice':
      return <MultipleChoice assessment={assessment} onComplete={onComplete} />
    case 'sorting':
      return <SortingTask assessment={assessment} onComplete={onComplete} />
    case 'metadata-edit':
      return <MetadataEditTask assessment={assessment} onComplete={onComplete} />
    case 'writing':
      return <WritingTask assessment={assessment} onComplete={onComplete} />
    case 'review':
      return <ReviewTask assessment={assessment} onComplete={onComplete} />
    case 'simulation':
      return (
        <SimulationTask
          assessment={assessment}
          onComplete={onComplete}
          missionId={missionId}
        />
      )
    default:
      return (
        <div style={{ padding: '1rem', color: 'var(--fcc-text-light)' }}>
          Unknown assessment type: {(assessment as Assessment).type}
        </div>
      )
  }
}
