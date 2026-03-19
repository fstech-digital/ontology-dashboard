const fs = require('fs')
const path = require('path')
const { checkAuth } = require('../../lib/auth')
const { providers } = require('../../lib/model-registry')

const ENV_PATH = path.resolve(process.cwd(), '.env')

function readEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf-8')
  } catch {
    return ''
  }
}

function writeEnv(content) {
  const tmpPath = ENV_PATH + '.tmp'
  fs.writeFileSync(tmpPath, content, 'utf-8')
  fs.renameSync(tmpPath, ENV_PATH)
}

function setEnvVar(key, value) {
  let env = readEnv()
  const lines = env.split('\n')
  const regex = new RegExp(`^${key}=`)
  const idx = lines.findIndex(l => regex.test(l))

  if (value) {
    const newLine = `${key}=${value}`
    if (idx >= 0) {
      lines[idx] = newLine
    } else {
      lines.push(newLine)
    }
  } else {
    // Reset: remove the line
    if (idx >= 0) {
      lines.splice(idx, 1)
    }
  }

  writeEnv(lines.filter((l, i) => !(l === '' && i === lines.length - 1)).join('\n') + '\n')

  // Update process.env immediately
  if (value) {
    process.env[key] = value
  } else {
    delete process.env[key]
  }
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { provider, apiKey } = req.body

  if (!provider || !providers[provider]) {
    return res.status(400).json({ error: `Provider invalido: ${provider}` })
  }

  const envKey = providers[provider].envKey
  setEnvVar(envKey, apiKey || '')

  res.status(200).json({
    ok: true,
    provider,
    hasKey: !!apiKey
  })
}
