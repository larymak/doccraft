/**
 * claude-api.ts
 *
 * Used ONLY for the final boss mission (u10-m01). Makes a real call to the
 * Anthropic Messages API via fetch (not the SDK) to avoid bundling issues.
 *
 * API key: import.meta.env.ANTHROPIC_API_KEY (set in .env)
 * Model:   claude-haiku-4-5-20251001 (fast and cheap for feedback)
 */

// =====================================================================
// Public types
// =====================================================================

export interface AIFeedbackResult {
  overallScore: number
  phaseScores: Record<string, number>
  strengths: string[]
  issues: Array<{
    severity: 'high' | 'medium' | 'low'
    phase: string
    message: string
    suggestion: string
  }>
  revisionPrompt: string
}

export interface PhaseAnswer {
  phaseId: string
  answer: string
}

// =====================================================================
// Internal constants
// =====================================================================

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1500
const CACHE_KEY_PREFIX = 'doccraft_boss_feedback_'

const SYSTEM_PROMPT =
  'You are an educational documentation coach evaluating student work. ' +
  'Be encouraging but specific. Return valid JSON only.'

// =====================================================================
// Fallback result
// =====================================================================

function buildFallback(reason?: string): AIFeedbackResult {
  return {
    overallScore: 70,
    phaseScores: {},
    strengths: [
      'You completed all phases of the boss mission — that takes commitment.',
    ],
    issues: [
      {
        severity: 'low',
        phase: 'general',
        message:
          reason ??
          'Automated feedback could not be generated at this time.',
        suggestion:
          'Review your answers against the mission rubric and try again if needed.',
      },
    ],
    revisionPrompt:
      'Consider revisiting each phase with the mission objectives in mind. ' +
      'Focus on clarity, completeness, and correct use of documentation conventions.',
  }
}

// =====================================================================
// buildPrompt
// =====================================================================

/**
 * Interpolate phase answers into the AI prompt template.
 * Template uses {phase1_answer}, {phase2_answer} … placeholders.
 * Also substitutes {phaseId_answer} variants for named phases.
 */
function buildPrompt(template: string, phaseAnswers: PhaseAnswer[]): string {
  let result = template

  phaseAnswers.forEach((pa, index) => {
    // Index-based key: {phase1_answer}, {phase2_answer}, …
    const indexedKey = `{phase${index + 1}_answer}`
    // Id-based key: {u10-m01-phase-planning_answer}, etc.
    const idKey = `{${pa.phaseId}_answer}`

    result = result.replaceAll(indexedKey, pa.answer)
    result = result.replaceAll(idKey, pa.answer)
  })

  return result
}

// =====================================================================
// getAIFeedback
// =====================================================================

/**
 * Make the Anthropic Messages API call and return a parsed AIFeedbackResult.
 *
 * Steps:
 *   1. Build the prompt from the template + phase answers
 *   2. POST to the Anthropic API with system + user messages
 *   3. Parse the JSON from the first content block's text
 *   4. Return a sensible fallback on any error rather than throwing
 */
export async function getAIFeedback(
  aiPromptTemplate: string,
  phaseAnswers: PhaseAnswer[],
): Promise<AIFeedbackResult> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[claude-api] ANTHROPIC_API_KEY is not set — returning fallback result.')
    return buildFallback('The API key is not configured. Contact your administrator.')
  }

  const userPrompt = buildPrompt(aiPromptTemplate, phaseAnswers)

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })
  } catch (networkErr) {
    console.error('[claude-api] Network error:', networkErr)
    return buildFallback('A network error occurred while contacting the feedback service.')
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => String(response.status))
    console.error('[claude-api] API error:', response.status, errorText)
    return buildFallback(`The feedback service returned an error (${response.status}).`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (parseErr) {
    console.error('[claude-api] Failed to parse API response as JSON:', parseErr)
    return buildFallback('Could not read the feedback service response.')
  }

  // Extract the text from the first content block
  const rawText: string | undefined = (
    body as {
      content?: Array<{ type: string; text?: string }>
    }
  )?.content?.[0]?.text

  if (!rawText) {
    console.error('[claude-api] No text content in API response:', body)
    return buildFallback('The feedback service returned an empty response.')
  }

  // Strip markdown fences defensively — the model is instructed to return
  // plain JSON, but wrapping in ```json ... ``` sometimes still occurs.
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as AIFeedbackResult

    // Validate the minimum expected shape before trusting it
    if (typeof parsed.overallScore !== 'number') {
      throw new Error('overallScore missing or not a number')
    }

    return {
      overallScore: Math.min(100, Math.max(0, parsed.overallScore)),
      phaseScores: parsed.phaseScores ?? {},
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      revisionPrompt: typeof parsed.revisionPrompt === 'string' ? parsed.revisionPrompt : '',
    }
  } catch (jsonErr) {
    console.error('[claude-api] Failed to parse model JSON:', jsonErr, '\nRaw text:', rawText)
    return buildFallback('The feedback could not be parsed. Your work has been recorded.')
  }
}

// =====================================================================
// Feedback cache (localStorage)
// =====================================================================

/**
 * Persist a feedback result to localStorage so it survives page refresh.
 */
export function cacheFeedback(missionId: string, result: AIFeedbackResult): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${missionId}`,
      JSON.stringify(result),
    )
  } catch {
    // Storage may be full or unavailable — fail silently
  }
}

/**
 * Load a previously cached feedback result from localStorage.
 * Returns null if nothing is cached or the stored data is unreadable.
 */
export function getCachedFeedback(missionId: string): AIFeedbackResult | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${missionId}`)
    if (!raw) return null
    return JSON.parse(raw) as AIFeedbackResult
  } catch {
    return null
  }
}
