const fs = require('fs')
const path = require('path')
const { ONTOLOGY_PATH } = require('./ares-context')

const CHAT_LOG_DIR = path.join(ONTOLOGY_PATH, 'logs', 'chat')

function getLogPath() {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return path.join(CHAT_LOG_DIR, `${month}.jsonl`)
}

function logMessage(role, content, meta = {}) {
  try {
    fs.mkdirSync(CHAT_LOG_DIR, { recursive: true })
    const entry = {
      ts: new Date().toISOString(),
      type: 'chat.message',
      agent: 'dashboard',
      role,
      content: typeof content === 'string' ? content.slice(0, 2000) : JSON.stringify(content).slice(0, 2000),
      ...meta
    }
    fs.appendFileSync(getLogPath(), JSON.stringify(entry) + '\n')
  } catch (err) {
    console.error('Chat log error:', err.message)
  }
}

module.exports = { logMessage }
