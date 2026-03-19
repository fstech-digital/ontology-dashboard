const path = require('path')
const fs = require('fs')
const { execFileSync } = require('child_process')
const { checkAuth } = require('../../lib/auth')
const { parseSpecProgress, parsePropostas } = require('../../lib/parsers')

const ONTOLOGY_PATH = process.env.ONTOLOGY_PATH || path.resolve(process.cwd(), '..')

// Map path patterns to JSONL event types (CWA: only these 11 types exist)
function classifyFile(filePath, status) {
  // Ignore dashboard code and meta files
  // Ignore build artifacts and tool-specific directories
  if (filePath.startsWith('dashboard/')) return null
  if (filePath.startsWith('node_modules/')) return null
  if (filePath.startsWith('.next/')) return null

  // Proposal files (match *-proposta.md or *-proposal.md)
  if (filePath.match(/propostas?\/.*-propos(ta|al)\.md$/) && status !== 'D') {
    return 'lead.proposal'
  }

  // Spec files modified
  if (filePath.match(/_specs\.md$/)) {
    return 'task.complete'
  }

  // Heartbeat
  if (filePath === 'HEARTBEAT.md') {
    return 'task.complete'
  }

  // Pin files
  if (filePath.match(/pins\/.*\.md$/)) {
    return 'entity.update'
  }

  // Financial data
  if (filePath.match(/\.jsonl$/) && filePath.includes('financ')) {
    return 'entity.update'
  }

  // Commercial logs (don't re-log our own log writes)
  if (filePath.match(/logs\/.*\.jsonl$/)) return null

  return null
}

// Generate event title based on type and file
function generateEventTitle(type, filePath, status) {
  const basename = path.basename(filePath, '.md')

  switch (type) {
    case 'lead.proposal': {
      // Extract lead name from filename: 2026-03-01-acme-corp-website-proposta.md
      const parts = basename.replace(/-proposta$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
      return `Proposal: ${parts.replace(/-/g, ' ')}`
    }
    case 'task.complete': {
      if (filePath === 'HEARTBEAT.md') return 'Heartbeat updated'
      // Try to parse spec progress
      const absPath = path.join(ONTOLOGY_PATH, filePath)
      const spec = parseSpecProgress(absPath)
      if (spec) return `${spec.name} ${spec.done}/${spec.total} (${spec.percentage}%)`
      return `Spec updated: ${path.basename(path.dirname(filePath))}`
    }
    case 'entity.update': {
      if (filePath.includes('financ')) return 'Financial data updated'
      if (filePath.match(/pins\//)) return `Pin updated: ${basename.replace(/-pin$/, '')}`
      return `Updated: ${basename}`
    }
    default:
      return `Changed: ${basename}`
  }
}

// Generate enriched details for proposals
function getProposalDetails(filePath) {
  try {
    const absPath = path.join(ONTOLOGY_PATH, filePath)
    const content = fs.readFileSync(absPath, 'utf-8')
    const nomeMatch = content.match(/\*\*Nome:\*\*\s*(.+)/i)
    const empresaMatch = content.match(/\*\*Empresa:\*\*\s*(.+)/i)
    const lead = nomeMatch ? nomeMatch[1].trim() : ''
    const empresa = empresaMatch ? empresaMatch[1].replace(/[*]/g, '').trim() : ''

    const valorMatches = content.match(/R\$\s*([\d.,]+)/g) || []
    let total = 0
    for (const m of valorMatches) {
      const num = parseFloat(m.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.'))
      if (!isNaN(num)) total += num
    }

    return { lead, empresa, valor: total > 0 ? `R$${Math.round(total).toLocaleString('pt-BR')}` : '' }
  } catch {
    return {}
  }
}

// Get changed files from git status
function getGitStatus() {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], {
      cwd: ONTOLOGY_PATH,
      encoding: 'utf-8',
      timeout: 5000
    })
    return output.trim().split('\n').filter(Boolean).map(line => {
      const status = line.substring(0, 2).trim()
      const filePath = line.substring(3).trim()
      return { status, filePath }
    })
  } catch {
    return []
  }
}

// Generate auto commit message
function generateCommitMessage(events, allFiles) {
  if (events.length === 0) {
    return `ops: ${allFiles.length} changes`
  }
  const typeCounts = {}
  for (const e of events) {
    const label = {
      'lead.proposal': 'proposta',
      'task.complete': 'spec',
      'entity.update': 'entidade'
    }[e.type] || e.type
    typeCounts[label] = (typeCounts[label] || 0) + 1
  }
  const parts = Object.entries(typeCounts).map(([k, v]) => `${v} ${k}${v > 1 ? 's' : ''}`)
  return `ops: ${allFiles.length} changes — ${parts.join(', ')}`
}

export default function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // GET: check status (for badge)
  if (req.method === 'GET') {
    const files = getGitStatus()
    const classified = files
      .map(f => ({ ...f, type: classifyFile(f.filePath, f.status) }))
      .filter(f => f.type)
    return res.status(200).json({
      totalChanges: files.length,
      operationalChanges: classified.length,
      files: files.map(f => ({
        status: f.status,
        path: f.filePath,
        type: classifyFile(f.filePath, f.status)
      }))
    })
  }

  // DELETE: discard all changes (git checkout + clean)
  if (req.method === 'DELETE') {
    try {
      const files = getGitStatus()
      if (files.length === 0) {
        return res.status(200).json({ status: 'discarded', files_reverted: 0 })
      }
      execFileSync('git', ['checkout', '.'], {
        cwd: ONTOLOGY_PATH,
        encoding: 'utf-8',
        timeout: 10000
      })
      execFileSync('git', ['clean', '-fd'], {
        cwd: ONTOLOGY_PATH,
        encoding: 'utf-8',
        timeout: 10000
      })
      return res.status(200).json({ status: 'discarded', files_reverted: files.length })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // POST: commit + write-back
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { message } = req.body || {}

    // 1. Get changed files
    const files = getGitStatus()
    if (files.length === 0) {
      return res.status(200).json({ status: 'no_changes', events_generated: 0, files_committed: 0 })
    }

    // 2. Classify and generate events
    const events = []
    const now = new Date()
    const ts = now.toISOString()

    for (const f of files) {
      const type = classifyFile(f.filePath, f.status)
      if (!type) continue

      const title = generateEventTitle(type, f.filePath, f.status)
      const event = {
        ts,
        type,
        agent: 'dashboard',
        project: f.filePath.match(/projetos\/([^/]+)/) ? f.filePath.match(/projetos\/([^/]+)/)[1] : 'pipeline',
        details: title
      }

      // Enrich proposal events
      if (type === 'lead.proposal') {
        const info = getProposalDetails(f.filePath)
        if (info.lead) event.lead = info.lead
        if (info.empresa) event.empresa = info.empresa
        if (info.valor) event.details = `Proposta criada: ${info.empresa} — ${info.valor}`
      }

      events.push(event)
    }

    // 3. Append events to JSONL (if any)
    if (events.length > 0) {
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const logDir = path.join(ONTOLOGY_PATH, 'logs', 'comercial')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }
      const logFile = path.join(logDir, `${month}.jsonl`)
      const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n'
      fs.appendFileSync(logFile, lines)
    }

    // 4. git add -A
    execFileSync('git', ['add', '-A'], {
      cwd: ONTOLOGY_PATH,
      encoding: 'utf-8',
      timeout: 10000
    })

    // 5. Commit
    const commitMsg = message || generateCommitMessage(events, files)
    execFileSync('git', ['commit', '-m', commitMsg], {
      cwd: ONTOLOGY_PATH,
      encoding: 'utf-8',
      timeout: 15000
    })

    // 6. Get commit hash
    let commitHash = ''
    try {
      commitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
        cwd: ONTOLOGY_PATH,
        encoding: 'utf-8',
        timeout: 5000
      }).trim()
    } catch { /* ok */ }

    // 7. Push
    let pushStatus = 'ok'
    try {
      execFileSync('git', ['push', 'origin', 'main'], {
        cwd: ONTOLOGY_PATH,
        encoding: 'utf-8',
        timeout: 30000
      })
    } catch (pushErr) {
      pushStatus = `push_failed: ${pushErr.message}`
    }

    return res.status(200).json({
      status: 'committed',
      commit_hash: commitHash,
      commit_message: commitMsg,
      events_generated: events.length,
      files_committed: files.length,
      push: pushStatus
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
