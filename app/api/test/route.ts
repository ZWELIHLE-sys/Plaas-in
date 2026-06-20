// Local test endpoint — lets you exercise the full message loop from a browser
// without WhatsApp. Visit e.g.:
//   /api/test?msg=Register a Boran bull, tag BOR-001
//   /api/test?msg=Added 3 Boer goats
//   /api/test?msg=show herd
// Optional &from=27820000001 to simulate a specific farmer's phone number.
import type { NextRequest } from 'next/server'
import { processMessage } from '@/lib/handler'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const msg = params.get('msg')
  const from = params.get('from') ?? '27820000001' // a fake demo farmer number

  if (!msg) {
    return Response.json(
      { error: 'Add ?msg=... to the URL, e.g. /api/test?msg=show herd' },
      { status: 400 },
    )
  }

  try {
    const reply = await processMessage(from, msg)
    return Response.json({ from, message: msg, reply })
  } catch (err) {
    const detail =
      err instanceof Error
        ? err.message
        : JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}))
    return Response.json({ error: detail }, { status: 500 })
  }
}
