// Turns a farmer's free-text WhatsApp message into structured data.
// Uses Claude when ANTHROPIC_API_KEY is set; otherwise (or on failure) falls
// back to the free keyword parser in keyword-parser.ts so the product still works.
import Anthropic from '@anthropic-ai/sdk'
import { ruleBasedParse } from '@/lib/keyword-parser'

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

export type ParsedHealth = {
  action_type?: string // Dipping | Vaccination | Treatment
  target?: string // "10 Boran calves" | "Cow-04" | "all cattle"
  chemical_used?: string // vaccine/medicine/dip name
  withdrawal_days?: number // meat/milk withdrawal period, if stated
  notes?: string
}

export type ParsedMessage = {
  intent:
    | 'register_animal'
    | 'show_herd'
    | 'set_profile'
    | 'log_health'
    | 'show_health'
    | 'other'
  animals: ParsedAnimal[]
  profile?: ParsedProfile
  health?: ParsedHealth
}

const SYSTEM_PROMPT = `You are the parser for Plaas-In, a WhatsApp farm record-keeper for South African farmers.
Read the farmer's message (English or Zulu) and call the record_message tool with structured data.

Intents:
- "register_animal": adding/registering one or more livestock.
- "show_herd": asking for a herd/livestock count or report.
- "set_profile": registering themselves / giving name, farm name, or area/location.
- "log_health": recording a dipping, vaccination, treatment, deworming or injection.
- "show_health": asking for health/vaccination history.
- "other": greetings, questions, or anything else.

Rules:
- species must be one of: Cattle, Goat, Sheep, Pig (map "cow/bull/calf/ox/heifer" -> Cattle).
- Only set animal_id if the farmer explicitly gives a tag (e.g. "tag BOR-001").
- Quantity: if they say a number ("3 Boer goats"), use it; otherwise 1.
- SA breeds: Cattle = Nguni, Boran, Brahman, Angus, Jersey, Holstein; Goat = Boer, Kalahari Red, Saanen; Sheep = Dorper, Merino.
- For log_health: action_type is Dipping, Vaccination or Treatment. target = which animals (e.g. "10 Boran calves"). chemical_used = the vaccine/medicine/disease named. withdrawal_days only if a withdrawal period is stated.`

const TOOL: Anthropic.Tool = {
  name: 'record_message',
  description: "Record the structured interpretation of the farmer's message.",
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['register_animal', 'show_herd', 'set_profile', 'log_health', 'show_health', 'other'],
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
      health: {
        type: 'object',
        description: 'Health event details (only when intent is log_health).',
        properties: {
          action_type: { type: 'string', enum: ['Dipping', 'Vaccination', 'Treatment'] },
          target: { type: 'string' },
          chemical_used: { type: 'string' },
          withdrawal_days: { type: 'integer', minimum: 0 },
          notes: { type: 'string' },
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
      health: input.health,
    }
  } catch (err) {
    // e.g. out of credit / network problem — degrade gracefully.
    console.warn('[plaas-in] Claude parse failed, using keyword fallback:', err)
    return ruleBasedParse(text)
  }
}
