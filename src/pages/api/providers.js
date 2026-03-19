const { getProvidersStatus } = require('../../lib/model-registry')
const { checkAuth } = require('../../lib/auth')

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  res.status(200).json(getProvidersStatus())
}
