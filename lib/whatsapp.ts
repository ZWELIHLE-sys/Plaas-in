// Sends a WhatsApp text reply via the Meta WhatsApp Cloud API (Graph API).
const GRAPH_VERSION = 'v21.0'

export async function sendWhatsAppText(to: string, body: string) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn('[plaas-in] WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set — cannot reply.')
    return
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    },
  )

  if (!res.ok) {
    console.error('[plaas-in] WhatsApp send failed:', res.status, await res.text())
  }
}
