const { verifyToken, authRequired } = require('../../../lib/auth')

export default function handler(req, res) {
  if (!authRequired()) {
    return res.json({ authenticated: true, authRequired: false })
  }

  const user = verifyToken(req)
  if (user) {
    return res.json({ authenticated: true, user: user.sub })
  }

  return res.status(401).json({ authenticated: false })
}
