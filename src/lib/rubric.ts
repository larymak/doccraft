import type {
  RubricItem,
  MultipleChoiceOption,
  SortingItem,
  ReviewCommentPrompt,
  MetadataValidationRule,
} from '@/types/content'

// =====================================================================
// Public types
// =====================================================================

export interface RubricEvaluation {
  passed: boolean
  score: number // 0-100
  results: Array<{
    id: string
    label: string
    passed: boolean
    feedback: string
    weight: number
  }>
}

// =====================================================================
// evaluateWritingRubric
// =====================================================================

/**
 * For writing tasks: check acceptedPatterns (case-insensitive) against
 * submitted text.
 *
 * - Items whose `checkFn` equals 'keyword-check' are auto-scored: pass if at
 *   least one `acceptedPatterns` entry appears in the text (case-insensitive).
 * - Items with no `checkFn` receive a partial score of 0.5 * weight (they
 *   require human or AI review to fully score).
 *
 * Overall score = sum of weights for passing items (keyword-check items that
 * match count as fully passing; no-checkFn items count as 0.5-passing, i.e.,
 * they contribute 0.5 * weight to the score but still set passed = false for
 * that result entry).
 *
 * The evaluation is considered "passed" when score >= 70.
 */
export function evaluateWritingRubric(
  text: string,
  rubric: RubricItem[],
  acceptedPatterns?: string[],
): RubricEvaluation {
  if (rubric.length === 0) {
    return { passed: false, score: 0, results: [] }
  }

  const lowerText = text.toLowerCase()
  const lowerPatterns = (acceptedPatterns ?? []).map(p => p.toLowerCase())

  let scoreAccumulator = 0
  const totalWeight = rubric.reduce((sum, item) => sum + item.weight, 0)

  const results = rubric.map(item => {
    if (item.checkFn === 'keyword-check') {
      // Must have at least one accepted pattern present in the text
      const matched =
        lowerPatterns.length > 0 &&
        lowerPatterns.some(p => lowerText.includes(p))

      if (matched) {
        scoreAccumulator += item.weight
        return {
          id: item.id,
          label: item.label,
          passed: true,
          feedback: `Keyword check passed — required terms found in submitted text.`,
          weight: item.weight,
        }
      }

      return {
        id: item.id,
        label: item.label,
        passed: false,
        feedback: `Keyword check failed — none of the required terms were found. Ensure your response includes relevant terminology.`,
        weight: item.weight,
      }
    }

    // No checkFn — partial credit pending human/AI review
    scoreAccumulator += item.weight * 0.5
    return {
      id: item.id,
      label: item.label,
      passed: false, // Requires human/AI verification
      feedback: `This criterion requires manual or AI review. You have received partial credit while your work is evaluated.`,
      weight: item.weight,
    }
  })

  const score =
    totalWeight > 0 ? Math.round((scoreAccumulator / totalWeight) * 100) : 0

  return {
    passed: score >= 70,
    score,
    results,
  }
}

// =====================================================================
// evaluateMetadataRubric
// =====================================================================

/**
 * Validate frontmatter against requiredFields and validationRules.
 *
 * Failure conditions per rule type:
 *   'required'  — field is missing or undefined
 *   'non-empty' — field is an empty string or empty array
 *   'one-of'    — field value is not in rule.value (array)
 *   'matches-pattern' — field value does not match the regex in rule.value
 *
 * Score = (passing required fields / total required fields) * 100
 */
export function evaluateMetadataRubric(
  frontmatter: Record<string, unknown>,
  requiredFields: string[],
  validationRules: MetadataValidationRule[],
): RubricEvaluation {
  if (requiredFields.length === 0) {
    return { passed: true, score: 100, results: [] }
  }

  // Build a lookup from field → rules for quick access
  const rulesByField = new Map<string, MetadataValidationRule[]>()
  for (const rule of validationRules) {
    const existing = rulesByField.get(rule.field) ?? []
    existing.push(rule)
    rulesByField.set(rule.field, existing)
  }

  let passingFields = 0

  const results = requiredFields.map(field => {
    const value = frontmatter[field]
    const fieldRules = rulesByField.get(field) ?? []

    let fieldPassed = true
    let feedback = `Field "${field}" is valid.`

    // Apply each rule for this field in order, stopping at first failure
    for (const rule of fieldRules) {
      if (rule.rule === 'required') {
        if (value === undefined || value === null) {
          fieldPassed = false
          feedback = rule.feedback
          break
        }
      } else if (rule.rule === 'non-empty') {
        if (
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          fieldPassed = false
          feedback = rule.feedback
          break
        }
      } else if (rule.rule === 'one-of') {
        const allowed = Array.isArray(rule.value) ? rule.value : [rule.value as string]
        if (!allowed.includes(String(value))) {
          fieldPassed = false
          feedback = rule.feedback
          break
        }
      } else if (rule.rule === 'matches-pattern') {
        const pattern = typeof rule.value === 'string' ? rule.value : ''
        try {
          const regex = new RegExp(pattern)
          if (!regex.test(String(value ?? ''))) {
            fieldPassed = false
            feedback = rule.feedback
            break
          }
        } catch {
          // Invalid regex — treat as failure
          fieldPassed = false
          feedback = `Invalid validation pattern for field "${field}".`
          break
        }
      }
    }

    // If no specific rule failed, still check base 'required' presence
    if (fieldPassed && (value === undefined || value === null)) {
      fieldPassed = false
      feedback = `Field "${field}" is required but missing.`
    }

    if (fieldPassed) passingFields++

    return {
      id: field,
      label: field,
      passed: fieldPassed,
      feedback,
      weight: 1, // Each required field has equal weight
    }
  })

  const score = Math.round((passingFields / requiredFields.length) * 100)

  return {
    passed: score >= 70,
    score,
    results,
  }
}

// =====================================================================
// scoreMultipleChoice
// =====================================================================

/**
 * Returns 100 if the selected option is correct, otherwise 0.
 */
export function scoreMultipleChoice(
  selectedId: string,
  options: MultipleChoiceOption[],
): number {
  if (options.length === 0) return 0
  const selected = options.find(o => o.id === selectedId)
  return selected?.isCorrect ? 100 : 0
}

// =====================================================================
// scoreSorting
// =====================================================================

/**
 * Returns (correct placements / total items) * 100, rounded to nearest integer.
 *
 * `userPlacements` maps item id → category id selected by the user.
 * Items not present in `userPlacements` count as incorrect.
 */
export function scoreSorting(
  userPlacements: Record<string, string>,
  items: SortingItem[],
): number {
  if (items.length === 0) return 0

  const correct = items.filter(
    item => userPlacements[item.id] === item.categoryId,
  ).length

  return Math.round((correct / items.length) * 100)
}

// =====================================================================
// scoreReview
// =====================================================================

/**
 * Returns (correct actions / total prompts) * 100.
 *
 * `userActions` maps prompt id → { action, comment? }.
 * A prompt is considered correct when the user's action matches
 * `correctAction` for that prompt. Missing entries count as incorrect.
 */
export function scoreReview(
  userActions: Record<string, { action: string; comment?: string }>,
  prompts: ReviewCommentPrompt[],
): number {
  if (prompts.length === 0) return 0

  const correct = prompts.filter(prompt => {
    const userAction = userActions[prompt.id]
    return userAction?.action === prompt.correctAction
  }).length

  return Math.round((correct / prompts.length) * 100)
}

// =====================================================================
// calculateWeightedScore
// =====================================================================

/**
 * Combine multiple attempt scores with XP weights to get an overall
 * scenario score.
 *
 * Uses XP reward as the weight for each attempt. Falls back to a simple
 * average if all XP rewards are zero.
 */
export function calculateWeightedScore(
  attempts: Array<{ score: number; xpReward: number }>,
): number {
  if (attempts.length === 0) return 0

  const totalWeight = attempts.reduce((sum, a) => sum + a.xpReward, 0)

  if (totalWeight === 0) {
    // Fall back to simple average
    const avg = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
    return Math.round(avg)
  }

  const weightedSum = attempts.reduce((sum, a) => sum + a.score * a.xpReward, 0)
  return Math.round(weightedSum / totalWeight)
}
