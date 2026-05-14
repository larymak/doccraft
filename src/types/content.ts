export type AssessmentType =
  | 'multiple-choice'
  | 'sorting'
  | 'metadata-edit'
  | 'writing'
  | 'review'
  | 'simulation'

export type ContentBlockVariant = 'info' | 'warning' | 'tip' | 'danger'

export interface ContentBlock {
  type: 'text' | 'callout' | 'example' | 'comparison' | 'code'
  content: string
  label?: string
  variant?: ContentBlockVariant
  language?: string
}

export interface RubricItem {
  id: string
  label: string
  description: string
  weight: number
  checkFn?: string
}

export interface Hint {
  level: 1 | 2 | 3
  text: string
}

// --- Doc asset ---

export interface DocAsset {
  id: string
  filename: string
  title: string
  body: string
  frontmatter: Record<string, unknown>
  trustScore: number
  findabilityScore: number
  issues: string[]
}

// --- Assessment data shapes ---

export interface MultipleChoiceOption {
  id: string
  text: string
  isCorrect: boolean
  explanation: string
}

export interface MultipleChoiceData {
  question: string
  options: MultipleChoiceOption[]
}

export interface SortingCategory {
  id: string
  label: string
  description: string
}

export interface SortingItem {
  id: string
  text: string
  categoryId: string
  explanation: string
}

export interface SortingData {
  instruction: string
  categories: SortingCategory[]
  items: SortingItem[]
}

export interface MetadataValidationRule {
  field: string
  rule: 'required' | 'non-empty' | 'matches-pattern' | 'one-of'
  value?: string | string[]
  feedback: string
}

export interface MetadataEditData {
  scenarioContext: string
  initialFrontmatter: Record<string, unknown>
  requiredFields: string[]
  optionalFields: string[]
  validationRules: MetadataValidationRule[]
}

export interface WritingData {
  scenarioContext: string
  docTemplate: string
  rubric: RubricItem[]
  wordCountMin?: number
  wordCountMax?: number
  acceptedPatterns?: string[]
  idealAnswer?: string
}

export interface ReviewFileChange {
  filename: string
  before: string
  after: string
}

export interface ReviewCommentPrompt {
  id: string
  lineRef: string
  question: string
  correctAction: 'approve' | 'request-changes' | 'comment'
  correctComment?: string
  explanation: string
}

export interface ReviewData {
  pullRequestTitle: string
  prDescription: string
  changedFiles: ReviewFileChange[]
  reviewCommentPrompts: ReviewCommentPrompt[]
  rubric: RubricItem[]
}

export interface SimulationPhase {
  id: string
  title: string
  description: string
  assessmentType: AssessmentType
  data: MultipleChoiceData | WritingData | MetadataEditData | ReviewData | SortingData
  xpReward: number
}

export interface SimulationData {
  scenario: string
  briefing: string
  phases: SimulationPhase[]
  aiPromptTemplate: string
  masteryRequirement: number
}

export type AssessmentData =
  | MultipleChoiceData
  | SortingData
  | MetadataEditData
  | WritingData
  | ReviewData
  | SimulationData

export interface Assessment {
  id: string
  type: AssessmentType
  title: string
  description: string
  data: AssessmentData
  rubric?: RubricItem[]
  hints: Hint[]
  xpReward: number
  masteryThreshold: number
  debtReduction: number
  trustDelta?: number
  findabilityDelta?: number
}

// --- Git workflow ---

export interface GitFileChange {
  filename: string
  before: string
  after: string
}

export interface GitWorkflow {
  changedFiles: GitFileChange[]
  commitMessageHints: string[]
  prChecklistItems: string[]
  reviewerComments: string[]
}

// --- Mission ---

export interface Mission {
  id: string
  unitId: string
  order: number
  title: string
  slug: string
  scenario: string
  objectives: string[]
  materials: DocAsset[]
  successCriteria: string[]
  assessments: Assessment[]
  gitWorkflow?: GitWorkflow
  estimatedMinutes: number
  prerequisiteMissionId?: string | null
}

// --- Badge ---

export interface Badge {
  id: string
  unitId?: string
  label: string
  description: string
  color: string
  iconSlug: string
  earnedCondition: string
}

// --- Unit ---

export type Tier = 'beginner' | 'intermediate' | 'advanced' | 'pro'

export interface Unit {
  id: string
  order: number
  title: string
  description: string
  goal: string
  missions: string[]
  bossMissionId: string
  badge: Badge
  totalXP: number
  tier: Tier
  prerequisiteUnitId?: string | null
  contentBlocks: ContentBlock[]
}
