// Turns a farmer's free-text WhatsApp message into structured data using Claude.
// Phase 1 understands two intents: registering animals, and asking for the herd report.
// Everything else falls through to `intent: "other"` so we can reply with help text.
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Haiku is fast + cheap, which suits high-volume, short farmer messages.
const MODEL = 'claude-haiku-4-5-20251001'

export type ParsedAnimal = {
  species?: string // Cattle | Goat | Sheep | Pig
  breed?: string // Nguni, Boran, Boer, Dorper, ...
  gender?: string // Male | Female
  animal_id?: string // human tag, e.g. BOR-001 (only if the farmer stated one)
  primary_product?: string // Beef | Dairy | Wool | Mutton | Pork
  quantity?: number // how many animals of this kind (default 1)
}

export type ParsedMessage = {
  intent: 'register_animal' | 'show_herd' | 'other'
  animals: ParsedAnimal[]
}

const SYSTEM_PROMPT = `You are the parser for Plaas-In, a WhatsApp farm record-keeper for South African farmers.
Read the farmer's message (English or Zulu) and call the record_message tool with structured data.

Rules:
- intent "register_animal": the farmer is adding/registering one or more livestock.
- intent "show_herd": the farmer asks for a herd/livestock count or report.
- intent "other": greetings, questions, or anything you cannot map to the above.
- species must be one of: Cattle, Goat, Sheep, Pig (map "cow/bull/calf/ox/heifer" -> Cattle).
- Only set animal_id if the farmer explicitly gives a tag (e.g. "tag BOR-001").
- If they say a number ("3 Boer goats"), set quantity to that number; otherwise quantity 1.
- Common SA breeds: Cattle = Nguni, Boran, Brahman, Angus, Jersey, Holstein; Goat = Boer, Kalahari Red, Saanen; Sheep = Dorper, Merino.`

const TOOL: Anthropic.Tool = {
  name: 'record_message',
  description: "Record the structured interpretation of the farmer's message.",
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: ['register_animal', 'show_herd', 'other'],
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
    },
    required: ['intent', 'animals'],
  },
}

export async function parseFarmerMessage(text: string): Promise<ParsedMessage> {
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
    return { intent: 'other', animals: [] }
  }

  const input = toolUse.input as ParsedMessage
  return {
    intent: input.intent ?? 'other',
    animals: Array.isArray(input.animals) ? input.animals : [],
  }
}
