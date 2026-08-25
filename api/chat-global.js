import { answerUserQuestion } from '../lib/answer-user-question.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      ok: true,
      ready: true,
      answer: 'Endpoint activo. Usa POST con { message } o { prompt }.',
      text: 'Endpoint activo. Usa POST con { message } o { prompt }.',
      data: 'Endpoint activo. Usa POST con { message } o { prompt }.',
    })
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido', success: false, ok: false })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const { status, json } = await answerUserQuestion(body)
  return res.status(status).json(json)
}
