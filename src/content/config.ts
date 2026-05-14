import { defineCollection, z } from 'astro:content'

const contentBlockSchema = z.object({
  type: z.enum(['text', 'callout', 'example', 'comparison', 'code']),
  content: z.string(),
  label: z.string().optional(),
  variant: z.enum(['info', 'warning', 'tip', 'danger']).optional(),
  language: z.string().optional(),
})

const hintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  text: z.string(),
})

const rubricItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(100),
  checkFn: z.string().optional(),
})

const docAssetSchema = z.object({
  id: z.string(),
  filename: z.string(),
  title: z.string(),
  body: z.string(),
  frontmatter: z.record(z.unknown()).default({}),
  trustScore: z.number().min(0).max(100),
  findabilityScore: z.number().min(0).max(100),
  issues: z.array(z.string()).default([]),
})

const assessmentSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple-choice', 'sorting', 'metadata-edit', 'writing', 'review', 'simulation']),
  title: z.string(),
  description: z.string(),
  xpReward: z.number(),
  masteryThreshold: z.number().min(0).max(100),
  debtReduction: z.number().min(0).max(20),
  trustDelta: z.number().optional(),
  findabilityDelta: z.number().optional(),
  hints: z.array(hintSchema).default([]),
  rubric: z.array(rubricItemSchema).optional(),
  data: z.record(z.unknown()),
})

const badgeSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  color: z.string(),
  iconSlug: z.string(),
  earnedCondition: z.string(),
})

const units = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    order: z.number(),
    title: z.string(),
    description: z.string(),
    goal: z.string(),
    prerequisiteUnitId: z.string().nullable().default(null),
    tier: z.enum(['beginner', 'intermediate', 'advanced', 'pro']).default('beginner'),
    badge: badgeSchema,
    totalXP: z.number(),
    contentBlocks: z.array(contentBlockSchema).default([]),
    missions: z.array(z.string()),
    bossMissionId: z.string(),
  }),
})

const missions = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    unitId: z.string(),
    order: z.number(),
    slug: z.string(),
    title: z.string(),
    scenario: z.string(),
    objectives: z.array(z.string()),
    materials: z.array(docAssetSchema).default([]),
    successCriteria: z.array(z.string()),
    estimatedMinutes: z.number(),
    prerequisiteMissionId: z.string().nullable().default(null),
    assessments: z.array(assessmentSchema),
    gitWorkflow: z.object({
      changedFiles: z.array(z.object({
        filename: z.string(),
        before: z.string(),
        after: z.string(),
      })),
      commitMessageHints: z.array(z.string()),
      prChecklistItems: z.array(z.string()),
      reviewerComments: z.array(z.string()),
    }).optional(),
  }),
})

export const collections = { units, missions }
