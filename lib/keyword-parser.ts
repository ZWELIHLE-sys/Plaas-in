// Free, dependency-light keyword parser used when no Claude API key is set (or
// if a Claude call fails). Covers the Phase 1 demo phrases: farmer profile,
// animal registration, herd report, and health/vaccination logging + history.
import { ALL_BREEDS } from '@/lib/constants'
import type { ParsedHealth, ParsedMessage, ParsedProfile } from '@/lib/parser'

const REPORT_WORDS = /\b(show|report|history|list|summary|view)\b/i

function detectSpecies(text: string): string | undefined {
  if (/\b(cattle|cow|cows|bull|bulls|calf|calves|ox|oxen|heifer|heifers|steer|steers)\b/i.test(text)) return 'Cattle'
  if (/\b(goat|goats|doe|does|buck|bucks|kid|kids)\b/i.test(text)) return 'Goat'
  if (/\b(sheep|lamb|lambs|ram|rams|ewe|ewes)\b/i.test(text)) return 'Sheep'
  if (/\b(pig|pigs|piglet|piglets|sow|sows|boar|boars|hog|hogs)\b/i.test(text)) return 'Pig'
  return undefined
}

function detectGender(text: string): string | undefined {
  if (/\b(bull|bulls|ram|rams|boar|boars|ox|oxen|steer|steers|buck|bucks|male)\b/i.test(text)) return 'Male'
  if (/\b(cow|cows|ewe|ewes|sow|sows|heifer|heifers|doe|does|female)\b/i.test(text)) return 'Female'
  return undefined
}

function detectBreed(text: string): string | undefined {
  return ALL_BREEDS.find((b) => new RegExp(`\\b${b}\\b`, 'i').test(text))
}

function detectHealthAction(text: string): string | undefined {
  if (/\bvaccinat\w*/i.test(text)) return 'Vaccination'
  if (/\bdip(p\w*|ped)?\b/i.test(text)) return 'Dipping'
  if (/\b(treat\w*|deworm\w*|drench\w*|inject\w*)\b/i.test(text)) return 'Treatment'
  return undefined
}

// "Register farmer: John Dube, Green Acres, Dundee"
function parseProfile(text: string): ParsedProfile | undefined {
  const m = text.match(/register\s+farmer\s*:?\s*(.+)/i)
  if (!m) return undefined
  const [name, farm_name, location] = m[1].split(',').map((s) => s.trim())
  const profile: ParsedProfile = {}
  if (name) profile.name = name
  if (farm_name) profile.farm_name = farm_name
  if (location) profile.location = location
  return Object.keys(profile).length ? profile : undefined
}

function parseHealth(text: string, action_type: string): ParsedHealth {
  // What was treated: the words after the action verb, up to "for/with/withdrawal".
  const targetMatch = text.match(
    /(?:vaccinat\w*|dipp?\w*|treat\w*|deworm\w*|drench\w*|inject\w*)\s+(.+?)(?:\s+(?:for|with|withdrawal)\b|$)/i,
  )
  const withMatch = text.match(/\bwith\s+([A-Za-z0-9][A-Za-z0-9 -]*)/i)
  const forMatch = text.match(/\bfor\s+([A-Za-z0-9][A-Za-z0-9 -]*)/i)
  const withdrawalMatch = text.match(/withdrawal[^\d]*(\d{1,3})/i)

  // Strip trailing time words / withdrawal phrases that aren't part of the value.
  const clean = (s?: string) =>
    s
      ?.replace(/\s+withdrawal.*$/i, '')
      .replace(/\s+(today|yesterday)\b.*$/i, '')
      .trim()

  const health: ParsedHealth = { action_type }
  const target = clean(targetMatch?.[1])
  if (target) health.target = target
  // Prefer an explicit "with <medicine>"; else the "for <disease/vaccine>".
  const chemical = clean(withMatch?.[1]) || clean(forMatch?.[1])
  if (chemical) health.chemical_used = chemical
  if (withdrawalMatch) health.withdrawal_days = parseInt(withdrawalMatch[1], 10)
  return health
}

export function ruleBasedParse(text: string): ParsedMessage {
  const profile = parseProfile(text)
  if (profile) return { intent: 'set_profile', animals: [], profile }

  const mentionsHealth = /\b(health|vaccin\w*|treatment|treated|dipping|dipped)\b/i.test(text)
  if (mentionsHealth && REPORT_WORDS.test(text)) {
    return { intent: 'show_health', animals: [] }
  }

  const healthAction = detectHealthAction(text)
  if (healthAction) {
    return { intent: 'log_health', animals: [], health: parseHealth(text, healthAction) }
  }

  const asksHerd = /\b(herd|count|total|livestock|stock|how many)\b/i.test(text)
  const isAdding = /\b(add|added|adding|register|registered|new|got|bought|buy|born)\b/i.test(text)
  if ((asksHerd || REPORT_WORDS.test(text)) && !isAdding) {
    return { intent: 'show_herd', animals: [] }
  }

  // Extract a tag first so its digits aren't mistaken for a quantity.
  const tagMatch =
    text.match(/tag\s*[:#]?\s*([A-Za-z]{2,}-?\d+)/i) || text.match(/\b([A-Za-z]{2,}-\d+)\b/)
  const animalId = tagMatch ? tagMatch[1].toUpperCase() : undefined
  const withoutTag = tagMatch ? text.replace(tagMatch[0], ' ') : text

  const species = detectSpecies(text)
  const breed = detectBreed(text)
  const gender = detectGender(text)
  if (!species && !breed) return { intent: 'other', animals: [] }

  const qtyMatch = withoutTag.match(/\b(\d{1,4})\b/)
  const quantity = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1

  return {
    intent: 'register_animal',
    animals: [{ species, breed, gender, animal_id: animalId, quantity }],
  }
}
