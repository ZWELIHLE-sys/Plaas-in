// Turns a farmer's free-text WhatsApp message into structured data.
// Uses Claude when ANTHROPIC_API_KEY is set; otherwise (or on failure) falls
// back to the free keyword parser so the product still works. The Claude prompt
// + tool schema live in parser-schema.ts.
import Anthropic from '@anthropic-ai/sdk'
import { ruleBasedParse } from '@/lib/keyword-parser'
import { SYSTEM_PROMPT, TOOL } from '@/lib/parser-schema'

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

export type ParsedBirth = {
  animal_id?: string // the calf's tag, if given
  species?: string
  breed?: string
  gender?: string
  mother_tag?: string
  father_tag?: string
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
    | 'register_birth'
    | 'show_herd'
    | 'show_bloodline'
    | 'set_profile'
    | 'log_health'
    | 'show_health'
    | 'other'
  animals: ParsedAnimal[]
  birth?: ParsedBirth
  target_tag?: string
  profile?: ParsedProfile
  health?: ParsedHealth
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
      birth: input.birth,
      target_tag: input.target_tag,
      profile: input.profile,
      health: input.health,
    }
  } catch (err) {
    // e.g. out of credit / network problem — degrade gracefully.
    console.warn('[plaas-in] Claude parse failed, using keyword fallback:', err)
    return ruleBasedParse(text)
  }
}
