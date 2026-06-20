// Core message orchestration for Plaas-In, shared by the WhatsApp webhook and
// the local test endpoint. Takes a farmer's phone + message, routes to the right
// domain action, and returns the reply text (it does NOT send anything itself).
import { getOrCreateFarmer } from '@/lib/supabase'
import { parseFarmerMessage } from '@/lib/parser'
import { registerAnimals, herdReport } from '@/lib/livestock'
import { updateProfile } from '@/lib/profile'
import { logHealth, healthReport } from '@/lib/health'
import { BRAND } from '@/lib/constants'

export async function processMessage(from: string, text: string): Promise<string> {
  const farmer = await getOrCreateFarmer(from)
  const parsed = await parseFarmerMessage(text)

  let reply: string
  switch (parsed.intent) {
    case 'set_profile':
      reply = await updateProfile(farmer.id, parsed.profile ?? {})
      break
    case 'register_animal':
      reply = parsed.animals.length ? await registerAnimals(farmer.id, parsed.animals) : helpText()
      break
    case 'show_herd':
      reply = await herdReport(farmer.id)
      break
    case 'log_health':
      reply = await logHealth(farmer.id, parsed.health ?? {})
      break
    case 'show_health':
      reply = await healthReport(farmer.id)
      break
    default:
      reply = helpText()
  }

  return withSlogan(reply)
}

// Every reply carries the mantra.
function withSlogan(reply: string): string {
  return `${reply}\n\n${BRAND.emoji} ${BRAND.slogan}`
}

function helpText(): string {
  return [
    `👋 Welcome to ${BRAND.name}.`,
    '',
    'Try one of these:',
    '• Register farmer: John Dube, Green Acres, Dundee',
    '• Register a Boran bull, tag BOR-001',
    '• Added 3 Boer goats',
    '• Vaccinated 10 calves for Blackquarter',
    '• Show herd',
    '• Show health',
  ].join('\n')
}
