// Plaas-In WhatsApp webhook (Meta Cloud API).
//   GET  → one-time webhook verification handshake with Meta.
//   POST → incoming farmer messages: understand → save → reply.
import type { NextRequest } from 'next/server'
import { getOrCreateFarmer, supabase } from '@/lib/supabase'
import { parseFarmerMessage, type ParsedAnimal } from '@/lib/claude'
import { sendWhatsAppText } from '@/lib/whatsapp'

// --- GET: Meta verification handshake -------------------------------------
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// --- POST: incoming messages ----------------------------------------------
export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  try {
    for (const message of extractTextMessages(payload)) {
      await handleMessage(message.from, message.text)
    }
  } catch (err) {
    // Log but still return 200 so Meta doesn't retry-storm us.
    console.error('[plaas-in] webhook error:', err)
  }

  // Meta requires a fast 200 to acknowledge receipt.
  return new Response('OK', { status: 200 })
}

// Pull { from, text } out of Meta's nested webhook payload.
function extractTextMessages(payload: unknown): { from: string; text: string }[] {
  const out: { from: string; text: string }[] = []
  const entries = (payload as any)?.entry ?? []
  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      for (const msg of change?.value?.messages ?? []) {
        if (msg?.type === 'text' && msg?.text?.body && msg?.from) {
          out.push({ from: String(msg.from), text: String(msg.text.body) })
        }
      }
    }
  }
  return out
}

async function handleMessage(from: string, text: string) {
  const farmer = await getOrCreateFarmer(from)
  const parsed = await parseFarmerMessage(text)

  let reply: string
  if (parsed.intent === 'register_animal' && parsed.animals.length > 0) {
    reply = await registerAnimals(farmer.id, parsed.animals)
  } else if (parsed.intent === 'show_herd') {
    reply = await herdReport(farmer.id)
  } else {
    reply =
      '👋 Welcome to Plaas-In. Try:\n' +
      '• "Register a Boran bull, tag BOR-001"\n' +
      '• "Added 3 Boer goats"\n' +
      '• "Show herd"'
  }

  await sendWhatsAppText(from, reply)
}

async function registerAnimals(farmerId: string, animals: ParsedAnimal[]): Promise<string> {
  const rows: Record<string, unknown>[] = []
  const summaries: string[] = []

  for (const a of animals) {
    const qty = a.quantity && a.quantity > 0 ? a.quantity : 1
    for (let i = 0; i < qty; i++) {
      rows.push({
        farmer_id: farmerId,
        species: a.species ?? null,
        breed: a.breed ?? null,
        gender: a.gender ?? null,
        primary_product: a.primary_product ?? null,
        // Only attach a tag when a single, specifically-tagged animal is added.
        animal_id: qty === 1 ? a.animal_id ?? null : null,
        status: 'Active',
      })
    }
    const label = [qty > 1 ? qty : '', a.breed, a.species ?? 'animal'].filter(Boolean).join(' ')
    summaries.push(a.animal_id && qty === 1 ? `${a.animal_id} — ${label}` : label)
  }

  const { error } = await supabase.from('animals').insert(rows)
  if (error) throw error

  return `✅ Recorded — ${summaries.join(', ')} added.`
}

async function herdReport(farmerId: string): Promise<string> {
  const { data, error } = await supabase
    .from('animals')
    .select('species')
    .eq('farmer_id', farmerId)
    .eq('status', 'Active')

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const species = (row as { species: string | null }).species ?? 'Other'
    counts.set(species, (counts.get(species) ?? 0) + 1)
  }

  const total = data?.length ?? 0
  if (total === 0) return '📊 No livestock recorded yet. Add some with e.g. "Added 3 Boer goats".'

  const breakdown = [...counts.entries()].map(([s, n]) => `${s} ${n}`).join(', ')
  return `📊 Total ${total} — ${breakdown}.`
}
