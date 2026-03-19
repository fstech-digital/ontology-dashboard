export default function handler(req, res) {
  res.setHeader('Set-Cookie', [
    'ares_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  ])
  return res.json({ ok: true })
}
