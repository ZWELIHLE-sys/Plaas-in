// Turns a farmer's free-text WhatsApp message into structured data.
// Uses Claude when ANTHROPIC_API_KEY is set; otherwise (or on failure) falls
// back to a free, dependency-light keyword parser so the product still works.
import Anthropic from '@anthropic-ai/sdk'
import { ALL_BREEDS } from '@/lib/constants'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Haiku is fast + cheap, which suits high-volume, short farmer messages.
const MODEL = 'claude-haiku-4-5-20251001'

export type ParsedAnimal = {
  species?: string // Cattle | Goat | Sheep | Pig
  breed?: string // Nguni, Boran, Boer, Dorper, ...
  gender?: string // Male | Female
  animal_id?: string // human tag, e.g. BOR-001 (only if stated)
  primary_product?: string // Beef | Dairy | Wool | Mutton | Pork
  quantity?: number // how many of this kind (default 1)
}

export type ParsedProfile = {
  name?: string
  farm_name?: string
  location?: string // the farmer's area / district
}

export type ParsedMessage = {
  intent: 'register_animal' | 'show_herd' | 'set_profile' | 'other'
  animals: ParsedAnimal[]
  profile?: ParsedProfile
}

const SYSTEM_PROMPT = `You are the parser for Plaas-In, a WhatsApp farm record-keeper for South African farmers.
Read the farmer's message (English or Zulu) and call the record_message tool with structured data.

Intents:
- "register_animal": adding/registering one or more livestock.
- "show_herd": asking for a herd/livestock count or report.
- "set_profile": the farmer is registering themselves or giving their name, farm name, or area/location.
- "other": greetings, questions, or anything else.

Rules:
- species must be one of: Cattle, Goat, Sheep, Pig (map "cow/bull/calf/ox/heifer" -> Cattle).
- Only set animal_id if the farmer explicitly gives a tag (e.g. "tag BOR-001").
- If they say a number ("3 Boer goats"), set quantity to that number; otherwise 1.
- Common SA breeds: Cattle = Nguni, Boran, Brahman, Angus, Jersey, Holstein; Goat = Boer, Kalahari Red, Saanen; Sheep = Dorper, Merino.
- For set_profile, extract name, farm_name and location/area when present.`

const TOOL: Anthropic.Tool = {
  name: 'record_message',
  description: "Record the structured interpretation of the farmer's message.",
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['register_animal', 'show_herd', 'set_profile', 'other'],
      },
      animals: {
        type: 'array',
        description: 'Animals to register (empty unless intent is register_animal).',
        items: {
          type: 'object',
          properties: {
            species: { type: 'string' },
            breed: { type: 'string' },
            gender: { type: 'string', enum: ['Male', 'Female'] },
            animal_id: { type: 'string' },
            primary_product: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
      },
      profile: {
        type: 'object',
        description: 'Farmer details (only when intent is set_profile).',
        properties: {
          name: { type: 'string' },
          farm_name: { type: 'string' },
          location: { type: 'string' },
        },
      },
    },
    required: ['intent', 'animals'],
  },
}

export async function parseFarmerMessage(text: string): Promise<ParsedMessage> {
  // No API key (no credit yet)? Use the FREE keyword parser. Add ANTHROPIC_API_KEY
  // later to switch on smarter understanding — nothing else needs to change.
  if (!process.env.ANTHROPIC_API_KEY) {
    return ruleBasedParse(text)
  }

  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'record_message' },
      messages: [{ role: 'user', content: text }],
    })

    const toolUse = res.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return ruleBasedParse(text)
    }

    const input = toolUse.input as ParsedMessage
    return {
      intent: input.intent ?? 'other',
      animals: Array.isArray(input.animals) ? input.animals : [],
      profile: input.profile,
    }
  } catch (err) {
    // e.g. out of credit / network problem — degrade gracefully.
    console.warn('[plaas-in] Claude parse failed, using keyword fallback:', err)
    return ruleBasedParse(text)
  }
}

// --- Free keyword fallback (no API key required) --------------------------

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

// Reliable explicit profile syntax advertised in the welcome message:
//   "Register farmer: John Dube, Green Acres, Dundee"
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

// A small rule-based parser covering the Phase 1 demo phrases. Good enough to
// register a farmer, register animals, and run the herd report with no paid API.
export function ruleBasedParse(text: string): ParsedMessage {
  const profile = parseProfile(text)
  if (profile) {
    return { intent: 'set_profile', animals: [], profile }
  }

  const asksReport = /\b(herd|report|how many|count|summary|total|livestock|stock)\b/i.test(text)
  const isAdding = /\b(add|added|adding|register|registered|new|got|bought|buy|born)\b/i.test(text)
  if (asksReport && !isAdding) {
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

  if (!species && !breed) {
    return { intent: 'other', animals: [] }
  }

  const qtyMatch = withoutTag.match(/\b(\d{1,4})\b/)
  const quantity = qtyMatch ? Math.max(1, parseInt(qtyMatch[1], 10)) : 1

  return {
    intent: 'register_animal',
    animals: [{ species, breed, gender, animal_id: animalId, quantity }],
  }
}
