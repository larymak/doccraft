/**
 * content-loader.ts
 *
 * Async helpers that load units and missions from Astro Content Collections.
 * These functions MUST be called only from Astro page files (.astro).
 * React components receive pre-loaded data as props — never call these
 * from inside a React component.
 */

import { getCollection } from 'astro:content'
import type { Unit, Mission, Assessment } from '@/types/content'

// =====================================================================
// Internal helpers
// =====================================================================

/**
 * Map a raw collection entry for a unit to the Unit type.
 * The YAML schema (config.ts) is validated by Astro so the shape is trusted.
 */
function entryToUnit(entry: { id: string; data: Record<string, unknown> }): Unit {
  return entry.data as unknown as Unit
}

/**
 * Map a raw collection entry for a mission to the Mission type.
 * The `assessments[].data` field uses `z.record(z.unknown())` in the schema,
 * so each assessment's data is cast to AssessmentData via the Assessment type.
 */
function entryToMission(entry: { id: string; data: Record<string, unknown> }): Mission {
  return entry.data as unknown as Mission
}

// =====================================================================
// Unit loaders
// =====================================================================

/**
 * Fetch and sort all units by `order` ascending.
 */
export async function getAllUnits(): Promise<Unit[]> {
  const entries = await getCollection('units')
  return entries
    .map(entryToUnit)
    .sort((a, b) => a.order - b.order)
}

/**
 * Fetch a single unit by id (e.g. 'unit-01').
 * Returns null if no matching unit is found.
 */
export async function getUnit(id: string): Promise<Unit | null> {
  const entries = await getCollection('units')
  const entry = entries.find(e => e.data.id === id)
  return entry ? entryToUnit(entry) : null
}

// =====================================================================
// Mission loaders
// =====================================================================

/**
 * Fetch all missions belonging to a unit, sorted by `order` ascending.
 */
export async function getMissionsForUnit(unitId: string): Promise<Mission[]> {
  const entries = await getCollection('missions')
  return entries
    .filter(e => e.data.unitId === unitId)
    .map(entryToMission)
    .sort((a, b) => a.order - b.order)
}

/**
 * Fetch a single mission by its slug (e.g. 'u01-m01').
 * Returns null if no matching mission is found.
 */
export async function getMissionBySlug(slug: string): Promise<Mission | null> {
  const entries = await getCollection('missions')
  const entry = entries.find(e => e.data.slug === slug)
  return entry ? entryToMission(entry) : null
}

/**
 * Fetch ALL missions across all units, sorted first by unitId then by order.
 */
export async function getAllMissions(): Promise<Mission[]> {
  const entries = await getCollection('missions')
  return entries
    .map(entryToMission)
    .sort((a, b) => {
      if (a.unitId < b.unitId) return -1
      if (a.unitId > b.unitId) return 1
      return a.order - b.order
    })
}

/**
 * Return all mission slugs — intended for use in `getStaticPaths()`.
 */
export async function getAllMissionSlugs(): Promise<string[]> {
  const entries = await getCollection('missions')
  return entries.map(e => e.data.slug as string)
}
