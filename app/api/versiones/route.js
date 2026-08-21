import { catalogoPublico } from '../../../lib/versiones.js'

export const runtime = 'nodejs'

export async function GET() {
  return Response.json({ success: true, data: catalogoPublico() })
}
