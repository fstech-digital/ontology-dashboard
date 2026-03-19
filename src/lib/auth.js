const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const JWT_SECRET = process.env.DASHBOARD_SECRET
if (!JWT_SECRET && process.env.DASHBOARD_USER) {
  throw new Error('DASHBOARD_SECRET must be set when DASHBOARD_USER is configured')
}
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

function verifyCredentials(username, password) {
  const validUser = process.env.DASHBOARD_USER
  const validPass = process.env.DASHBOARD_PASS
  if (!validUser || !validPass) return false

  const userMatch = username.length === validUser.length &&
    crypto.timingSafeEqual(Buffer.from(username), Buffer.from(validUser))
  const passMatch = password.length === validPass.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(validPass))

  return userMatch && passMatch
}

function signToken(username) {
  return jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: TOKEN_MAX_AGE })
}

function verifyToken(req) {
  // 1. Cookie
  const cookieHeader = req.headers.cookie || ''
  const match = cookieHeader.match(/ares_token=([^;]+)/)
  if (match) {
    try {
      return jwt.verify(match[1], JWT_SECRET)
    } catch {}
  }

  // 2. Authorization header
  const auth = req.headers.authorization || ''
  if (auth.startsWith('Bearer ')) {
    try {
      return jwt.verify(auth.slice(7), JWT_SECRET)
    } catch {}
  }

  // 3. Legacy X-Auth-Token (backward compat)
  const legacyToken = process.env.DASHBOARD_TOKEN
  if (legacyToken && req.headers['x-auth-token'] === legacyToken) {
    return { sub: 'token' }
  }

  return null
}

function authRequired() {
  return !!(process.env.DASHBOARD_USER && process.env.DASHBOARD_PASS)
}

function withAuth(handler) {
  return (req, res) => {
    if (!authRequired()) return handler(req, res)
    if (!verifyToken(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    return handler(req, res)
  }
}

// Backward compat: checkAuth returns boolean (used by endpoints that call it inline)
function checkAuth(req) {
  if (!authRequired()) return true
  return !!verifyToken(req)
}

module.exports = { verifyCredentials, signToken, verifyToken, withAuth, authRequired, checkAuth }
