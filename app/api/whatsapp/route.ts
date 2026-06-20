// Plaas-In WhatsApp webhook (Meta Cloud API).
//   GET  → one-time webhook verification handshake with Meta.
//   POST → incoming farmer messages: understand → save → reply.
import type { NextRequest } from 'next/server'
import { processMessage } from '@/lib/handler'
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
      const reply = await processMessage(message.from, message.text)
      await sendWhatsAppText(message.from, reply)
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
