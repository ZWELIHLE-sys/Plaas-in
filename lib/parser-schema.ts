// The Claude system prompt + tool schema for message parsing. Kept separate from
// parser.ts so each file stays small and the schema is easy to read/extend.
import type Anthropic from '@anthropic-ai/sdk'

export const SYSTEM_PROMPT = `You are the parser for Plaas-In, a WhatsApp farm record-keeper for South African farmers.
Read the farmer's message (English or Zulu) and call the record_message tool with structured data.

Intents:
- "register_animal": adding/registering existing livestock (no parents mentioned).
- "register_birth": a new animal was BORN, with a mother and/or father stated.
- "show_herd": asking for a herd/livestock count or report.
- "show_bloodline": asking for the parents / lineage / bloodline of a specific animal.
- "set_profile": registering themselves / giving name, farm name, or area/location.
- "log_health": recording a dipping, vaccination, treatment, deworming or injection.
- "show_health": asking for health/vaccination history.
- "log_sale": recording a sale of livestock (sold ... for R... to ... at ...).
- "show_sales": asking for sales / income / ledger history.
- "other": greetings, questions, or anything else.

Rules:
- species: one of Cattle, Goat, Sheep, Pig (map cow/bull/calf/ox/heifer -> Cattle; kid -> Goat; lamb -> Sheep; piglet -> Pig).
- Only set animal_id / tags if explicitly stated (e.g. "tag BOR-001", "Mother Cow-04").
- Quantity: use the stated number, else 1.
- SA breeds: Cattle = Nguni, Boran, Brahman, Angus, Jersey, Holstein; Goat = Boer, Kalahari Red, Saanen; Sheep = Dorper, Merino.
- register_birth: set birth.mother_tag / birth.father_tag to the parents' tags, plus species/gender/breed and animal_id if the calf was given a tag.
- show_bloodline: set target_tag to the animal whose lineage is asked for.
- log_health: action_type is Dipping, Vaccination or Treatment; target = which animals; chemical_used = vaccine/medicine/disease; withdrawal_days only if stated.
- log_sale: item_details = what was sold (tag like "Bull-02" or "2 goats"); sale_type = Direct, Auction or Butchery; amount = rand number; set buyer_name and sale_location when given.`

export const TOOL: Anthropic.Tool = {
  name: 'record_message',
  description: "Record the structured interpretation of the farmer's message.",
  input_schema: {
    type: 'object',
    properties: {
      intent: {
        type: 'string',
        enum: [
          'register_animal',
          'register_birth',
          'show_herd',
          'show_bloodline',
          'set_profile',
          'log_health',
          'show_health',
          'log_sale',
          'show_sales',
          'other',
        ],
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
      birth: {
        type: 'object',
        description: 'New birth details (only when intent is register_birth).',
        properties: {
          animal_id: { type: 'string' },
          species: { type: 'string' },
          breed: { type: 'string' },
          gender: { type: 'string', enum: ['Male', 'Female'] },
          mother_tag: { type: 'string' },
          father_tag: { type: 'string' },
        },
      },
      target_tag: {
        type: 'string',
        description: 'The animal tag whose bloodline is requested (intent show_bloodline).',
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
      sale: {
        type: 'object',
        description: 'Sale details (only when intent is log_sale).',
        properties: {
          item_details: { type: 'string' },
          product_type: { type: 'string' },
          sale_type: { type: 'string', enum: ['Direct', 'Auction', 'Butchery'] },
          buyer_name: { type: 'string' },
          sale_location: { type: 'string' },
          amount: { type: 'number', minimum: 0 },
        },
      },
    },
    required: ['intent', 'animals'],
  },
}
