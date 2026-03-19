const fs = require('fs')
const path = require('path')
const { getDashboardConfig } = require('./config')

const ONTOLOGY_PATH = process.env.ONTOLOGY_PATH || path.resolve(process.cwd(), '..')

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

function buildSystemPrompt() {
  const config = getDashboardConfig()
  const instanceName = config.instance?.name || 'Dashboard'

  const parts = [`You are an AI assistant operating the ${instanceName} dashboard. You have access to the ontology workspace via tools.`]
  parts.push('Be concise and operational.')
  parts.push('')

  // Load heartbeat if configured
  const heartbeatFile = config.parsers?.heartbeat?.file
  if (heartbeatFile) {
    const heartbeat = readFileIfExists(path.join(ONTOLOGY_PATH, heartbeatFile))
    if (heartbeat) {
      parts.push('## HEARTBEAT (pending tasks)')
      parts.push(heartbeat.slice(0, 4000))
      parts.push('')
    }
  }

  // Load operations pin if configured
  const pinFile = config.parsers?.agents?.file
  if (pinFile) {
    const pin = readFileIfExists(path.join(ONTOLOGY_PATH, pinFile))
    if (pin) {
      parts.push('## Operations Pin')
      parts.push(pin.slice(0, 6000))
      parts.push('')
    }
  }

  const enabledTools = config.tools || ['read_file', 'list_directory', 'ontology_search']
  parts.push('## Available tools')
  parts.push(`You have access to: ${enabledTools.join(', ')}.`)
  parts.push('Use them when needed to answer questions about the workspace.')
  parts.push(`Workspace root: ${ONTOLOGY_PATH}`)
  parts.push(`Current date: ${new Date().toISOString().split('T')[0]}`)

  return parts.join('\n')
}

module.exports = { buildSystemPrompt, ONTOLOGY_PATH }
