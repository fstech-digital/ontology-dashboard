const { verifyCredentials, signToken } = require('../../../lib/auth')

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }

  if (!verifyCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = signToken(username)

  res.setHeader('Set-Cookie', [
    `ares_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`
  ])

  return res.json({ ok: true, token })
}
