// Free, dependency-light keyword parser used when no Claude API key is set (or
// if a Claude call fails). Covers the Phase 1 demo phrases: farmer profile,
// animal registration, births + bloodline, herd report, and health logging.
import { ALL_BREEDS } from '@/lib/constants'
import type { ParsedBirth, ParsedHealth, ParsedMessage, ParsedProfile, ParsedSale } from '@/lib/parser'

const REPORT_WORDS = /\b(show|report|history|list|summary|view|of)\b/i
const TAG = /\b([A-Za-z]{2,}-\d+)\b/

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

// "New calf born. Mother Cow-04, Father Bull-01"
function parseBirth(text: string): ParsedBirth | undefined {
  const mother = text.match(/\b(?:mother|dam|mum|mom)\s*[:#]?\s*([A-Za-z]{2,}-?\d+)/i)
  const father = text.match(/\b(?:father|sire|dad)\s*[:#]?\s*([A-Za-z]{2,}-?\d+)/i)
  if (!mother && !father) return undefined

  // Describe the calf from the text with the parent clauses removed, so the
  // mother's/father's own species/gender words don't get attributed to the calf.
  let calfText = text
  if (mother) calfText = calfText.replace(mother[0], ' ')
  if (father) calfText = calfText.replace(father[0], ' ')

  const birth: ParsedBirth = {}
  if (mother) birth.mother_tag = mother[1].toUpperCase()
  if (father) birth.father_tag = father[1].toUpperCase()
  const tagMatch = calfText.match(/tag\s*[:#]?\s*([A-Za-z]{2,}-?\d+)/i)
  if (tagMatch) birth.animal_id = tagMatch[1].toUpperCase()
  const species = detectSpecies(calfText)
  if (species) birth.species = species
  const gender = detectGender(calfText)
  if (gender) birth.gender = gender
  const breed = detectBreed(calfText)
  if (breed) birth.breed = breed
  return birth
}

function parseHealth(text: string, action_type: string): ParsedHealth {
  const targetMatch = text.match(
    /(?:vaccinat\w*|dipp?\w*|treat\w*|deworm\w*|drench\w*|inject\w*)\s+(.+?)(?:\s+(?:for|with|withdrawal)\b|$)/i,
  )
  const withMatch = text.match(/\bwith\s+([A-Za-z0-9][A-Za-z0-9 -]*)/i)
  const forMatch = text.match(/\bfor\s+([A-Za-z0-9][A-Za-z0-9 -]*)/i)
  const withdrawalMatch = text.match(/withdrawal[^\d]*(\d{1,3})/i)

  const clean = (s?: string) =>
    s?.replace(/\s+withdrawal.*$/i, '').replace(/\s+(today|yesterday)\b.*$/i, '').trim()

  const health: ParsedHealth = { action_type }
  const target = clean(targetMatch?.[1])
  if (target) health.target = target
  const chemical = clean(withMatch?.[1]) || clean(forMatch?.[1])
  if (chemical) health.chemical_used = chemical
  if (withdrawalMatch) health.withdrawal_days = parseInt(withdrawalMatch[1], 10)
  return health
}

// "Sold Bull-02 at Dundee Auction for R18,000 to Mr Sithole"
function parseSale(text: string): ParsedSale | undefined {
  if (!/\bsold\b/i.test(text)) return undefined
  const sale: ParsedSale = {}

  const amt = text.match(/\bR\s?([\d][\d,\s]*)/i) || text.match(/\bfor\s+R?\s?([\d][\d,\s]*)/i)
  if (amt) {
    const n = parseInt(amt[1].replace(/[,\s]/g, ''), 10)
    if (!Number.isNaN(n)) sale.amount = n
  }

  if (/\bauction\b/i.test(text)) sale.sale_type = 'Auction'
  else if (/\b(butchery|abattoir)\b/i.test(text)) sale.sale_type = 'Butchery'
  else sale.sale_type = 'Direct'

  const buyer = text.match(/\bto\s+([A-Za-z][A-Za-z .'-]*?)(?:\s+(?:at|for)\b|[.,]|$)/i)
  if (buyer) sale.buyer_name = buyer[1].trim()

  const loc = text.match(
    /\bat\s+([A-Za-z][A-Za-z .'-]*?)(?:\s+(?:auction|butchery|abattoir|for|to)\b|[.,]|$)/i,
  )
  if (loc) sale.sale_location = loc[1].trim()

  const item = text.match(/\bsold\s+(.+?)(?:\s+(?:at|for|to)\b|[.,]|$)/i)
  if (item) sale.item_details = item[1].trim()
  return sale
}

export function ruleBasedParse(text: string): ParsedMessage {
  const profile = parseProfile(text)
  if (profile) return { intent: 'set_profile', animals: [], profile }

  const mentionsLineage = /\b(bloodline|lineage|pedigree|ancestry|family tree|parents)\b/i.test(text)
  const tag = text.match(TAG)?.[1]?.toUpperCase()
  if (mentionsLineage && REPORT_WORDS.test(text) && tag) {
    return { intent: 'show_bloodline', animals: [], target_tag: tag }
  }

  const birth = parseBirth(text)
  if (birth) return { intent: 'register_birth', animals: [], birth }

  const mentionsSales = /\b(sales|ledger|income|revenue|earnings)\b/i.test(text)
  if (mentionsSales && REPORT_WORDS.test(text)) {
    return { intent: 'show_sales', animals: [] }
  }
  const sale = parseSale(text)
  if (sale) return { intent: 'log_sale', animals: [], sale }

  const mentionsHealth = /\b(health|vaccin\w*|treatment|treated|dipping|dipped)\b/i.test(text)
  if (mentionsHealth && REPORT_WORDS.test(text)) {
    return { intent: 'show_health', animals: [] }
  }
  const healthAction = detectHealthAction(text)
  if (healthAction) {
    return { intent: 'log_health', animals: [], health: parseHealth(text, healthAction) }
  }

  const asksHerd = /\b(herd|count|total|livestock|stock|how many)\b/i.test(text)
  const isAdding = /\b(add|added|adding|register|registered|new|got|bought|buy)\b/i.test(text)
  if ((asksHerd || REPORT_WORDS.test(text)) && !isAdding) {
    return { intent: 'show_herd', animals: [] }
  }

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
