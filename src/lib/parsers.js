const fs = require('fs')
const path = require('path')

/**
 * Parse a JSONL file into an array of objects.
 * Skips malformed lines silently.
 */
function parseJSONL(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Parse a _specs.md file and count [x] vs [ ] checkboxes.
 * Returns { name, done, total, percentage }
 */
function parseSpecProgress(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract project name from header or directory
    const headerMatch = content.match(/^#\s+.*?Spec:\s*(.+)$/m)
    const name = headerMatch
      ? headerMatch[1].trim()
      : path.basename(path.dirname(filePath))

    const done = (content.match(/- \[x\]/g) || []).length
    const pending = (content.match(/- \[ \]/g) || []).length
    const total = done + pending
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0

    return { name, done, total, percentage, path: filePath }
  } catch {
    return null
  }
}

/**
 * Parse the operations pin to extract agent table.
 * Returns array of { name, runtime, papel, canais, status }
 */
function parsePinAgents(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Find the agent hierarchy table
    const tableRegex = /\|\s*Agente\s*\|\s*Runtime\s*\|\s*Papel\s*\|\s*Canais\s*\|[\s\S]*?(?=\n---|\n##|\n\n\n)/
    const tableMatch = content.match(tableRegex)
    if (!tableMatch) return []

    const lines = tableMatch[0].split('\n').filter(l => l.trim().startsWith('|'))
    // Skip header and separator
    const dataLines = lines.slice(2)

    return dataLines.map(line => {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length < 4) return null

      const name = cells[0].replace(/\*\*/g, '').replace(/\(.*?\)/, '').trim()
      return {
        name,
        runtime: cells[1],
        papel: cells[2],
        canais: cells[3],
        status: 'Ativo'
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

/**
 * Parse HEARTBEAT.md to count pending tasks.
 * Completed items are removed from HEARTBEAT (not marked [x]) and archived.
 * Returns { pending, done, pendingItems[] }
 */
function parseHeartbeat(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    let pending = 0
    const pendingItems = []
    let currentSection = ''

    for (const line of lines) {
      if (line.startsWith('### ') || line.startsWith('## ')) {
        currentSection = line.replace(/^#+\s*/, '').trim()
      }
      if (/^- \[ \]/.test(line)) {
        pending++
        pendingItems.push({
          text: line.replace(/^- \[ \]\s*/, '').trim(),
          section: currentSection
        })
      }
    }

    return { pending, done: 0, pendingItems: pendingItems.reverse() }
  } catch {
    return { pending: 0, done: 0, pendingItems: [] }
  }
}

/**
 * Aggregate financial data from PJ JSONL files.
 * Scans financial JSONL files (excluding card-specific files for cleaner view).
 * Returns { months: [{ month, receita, despesa }] }
 */
function aggregateFinanceiro(basePath) {
  try {
    const pjDir = path.join(basePath, 'financeiro', 'data')
    if (!fs.existsSync(pjDir)) return { months: [] }

    const files = fs.readdirSync(pjDir)
      .filter(f => f.endsWith('.jsonl') && !f.includes('cartao'))
      .sort()

    const monthlyData = {}

    for (const file of files) {
      const month = file.replace('.jsonl', '')
      const records = parseJSONL(path.join(pjDir, file))

      let receita = 0
      let despesa = 0

      for (const r of records) {
        if (typeof r.valor !== 'number') continue
        // Skip internal transfers for cleaner picture
        if (r.categoria && r.categoria.startsWith('bancario/')) continue
        if (r.valor > 0) receita += r.valor
        else despesa += Math.abs(r.valor)
      }

      monthlyData[month] = { month, receita: Math.round(receita), despesa: Math.round(despesa) }
    }

    // Also include cartao expenses
    const cartaoFiles = files.length === 0 ? [] : fs.readdirSync(pjDir)
      .filter(f => f.endsWith('.cartao.jsonl'))
      .sort()

    for (const file of cartaoFiles) {
      const month = file.replace('.cartao.jsonl', '')
      const records = parseJSONL(path.join(pjDir, file))

      if (!monthlyData[month]) {
        monthlyData[month] = { month, receita: 0, despesa: 0 }
      }

      for (const r of records) {
        if (typeof r.valor !== 'number') continue
        if (r.categoria && r.categoria.startsWith('bancario/')) continue
        if (r.valor > 0) monthlyData[month].receita += Math.round(r.valor)
        else monthlyData[month].despesa += Math.round(Math.abs(r.valor))
      }
    }

    const months = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
    // Return last 6 months
    return { months: months.slice(-6) }
  } catch {
    return { months: [] }
  }
}

/**
 * Parse commercial JSONL logs and return active leads + recent activities.
 */
function parseComercial(basePath) {
  try {
    const logDir = path.join(basePath, 'logs', 'comercial')
    if (!fs.existsSync(logDir)) return { leads: [], activities: [] }

    const files = fs.readdirSync(logDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort()

    let allRecords = []
    for (const file of files) {
      const records = parseJSONL(path.join(logDir, file))
      allRecords = allRecords.concat(records)
    }

    // Normalize timestamps
    allRecords = allRecords.map(r => ({
      ...r,
      _ts: r.ts || r.timestamp || r.date || ''
    }))

    // Sort by timestamp descending
    allRecords.sort((a, b) => b._ts.localeCompare(a._ts))

    // Normalize lead name for consistent matching (slug-like key)
    const normalizeKey = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Build lead status map — proposals tracked separately, skip here
    const leadMap = {}
    for (const r of allRecords) {
      const leadName = r.lead || r.lead_name || ''
      if (!leadName) continue

      const type = r.type || r.event || ''
      // Skip non-lead types (entity.update, task.complete, cron.*, infrastructure_*, lead.proposal)
      // lead.proposal entries are tracked in the Propostas table, not Pipeline
      if (/^(entity\.|task\.|cron\.|infrastructure_|commercial_update|lead\.proposal)/.test(type)) continue

      const details = r.details || r.motivo || ''
      const isArchived = type.includes('archived') || type.includes('descartado') || r.event === 'lost' || /DESCARTADO|ARQUIVADO|PERDIDO/i.test(details)

      const key = normalizeKey(leadName)
      if (!leadMap[key]) {
        leadMap[key] = {
          id: leadName,
          lead: leadName,
          empresa: r.empresa || r.company || '-',
          status: isArchived ? 'Arquivado' : 'Ativo',
          ultimoContato: (r._ts || '').substring(0, 10)
        }
      } else if (isArchived) {
        // If any entry archives this lead, mark it archived
        leadMap[key].status = 'Arquivado'
      }
    }

    // Active leads (not archived)
    const leads = Object.values(leadMap)
      .filter(l => l.status === 'Ativo')
      .sort((a, b) => b.ultimoContato.localeCompare(a.ultimoContato))

    // Recent activities — map to timeline format
    const typeConfig = {
      'lead.contact': { icon: 'tabler:user-plus', color: 'success', label: 'Novo lead' },
      'lead_contact': { icon: 'tabler:user-plus', color: 'success', label: 'Novo lead' },
      'lead.archived': { icon: 'tabler:archive', color: 'secondary', label: 'Arquivado' },
      'lead_archived': { icon: 'tabler:archive', color: 'secondary', label: 'Arquivado' },
      'lead_descartado': { icon: 'tabler:trash', color: 'error', label: 'Descartado' },
      'decision.made': { icon: 'tabler:bulb', color: 'warning', label: 'Decisao' },
      'proposal_sent': { icon: 'tabler:send', color: 'info', label: 'Proposta enviada' },
      'proposal_update': { icon: 'tabler:file-text', color: 'info', label: 'Proposta' },
      'proposal_draft': { icon: 'tabler:file-pencil', color: 'info', label: 'Rascunho' },
      'meeting_done': { icon: 'tabler:video', color: 'primary', label: 'Reuniao' },
      'syaas_onboarding': { icon: 'tabler:rocket', color: 'success', label: 'Onboarding' },
      'commercial_update': { icon: 'tabler:chart-bar', color: 'primary', label: 'Comercial' },
      'infrastructure_update': { icon: 'tabler:server', color: 'warning', label: 'Infra' },
      'infrastructure_config': { icon: 'tabler:settings', color: 'warning', label: 'Config' }
    }

    const activities = allRecords.slice(0, 15).map((r, i) => {
      const type = r.type || r.event || 'info'
      const config = typeConfig[type] || { icon: 'tabler:circle', color: 'primary', label: type }
      const lead = r.lead || r.lead_name || r.project || ''
      const details = r.details || r.details || r.motivo || r.action || ''

      return {
        id: i,
        title: `${config.label}${lead ? ': ' + lead : ''}`,
        description: details.length > 100 ? details.substring(0, 100) + '...' : details,
        time: (r._ts || '').substring(0, 16).replace('T', ' '),
        type: config.color,
        icon: config.icon
      }
    })

    return { leads, activities }
  } catch {
    return { leads: [], activities: [] }
  }
}

/**
 * Parse proposal .md files from the proposals directory.
 * Extracts lead, empresa, valor, data, url, followUp from each file.
 * Returns array sorted by date (most recent first).
 */
function parsePropostas(basePath) {
  try {
    const propostasDir = path.join(basePath, 'comercial', 'propostas')
    if (!fs.existsSync(propostasDir)) return []

    const files = fs.readdirSync(propostasDir)
      .filter(f => f.endsWith('-proposta.md'))
      .sort()

    const propostas = []

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(propostasDir, file), 'utf-8')

        // Date from filename (2026-03-02-...)
        const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/)
        const data = dateMatch ? dateMatch[1] : ''

        // Lead name: **Nome:** or **Contato:**
        const nomeMatch = content.match(/\*\*Nome:\*\*\s*(.+)/i)
        const contatoMatch = content.match(/\*\*Contato:\*\*\s*(.+)/i)
        const lead = (nomeMatch ? nomeMatch[1] : contatoMatch ? contatoMatch[1] : file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-proposta\.md$/, '')).replace(/\s*\(.*?\)\s*/g, '').trim()

        // Empresa
        const empresaMatch = content.match(/\*\*Empresa:\*\*\s*(.+)/i)
        const empresa = empresaMatch ? empresaMatch[1].replace(/[*]/g, '').trim() : '-'

        // Valor: sum all R$ amounts from **Proposta:** or **Investimento** or **Fase X** lines
        let valorTotal = 0
        const propostaLine = content.match(/\*\*Proposta:\*\*\s*(.+)/i)
        const investLines = content.match(/\*\*(?:Fase \d+|Investimento)[^*]*:\*\*\s*(.+)/gi)

        const extractReais = (text) => {
          const matches = text.match(/R\$\s*([\d.,]+)/g) || []
          let sum = 0
          for (const m of matches) {
            const numStr = m.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
            const num = parseFloat(numStr)
            if (!isNaN(num)) sum += num
          }
          return sum
        }

        if (propostaLine) {
          valorTotal = extractReais(propostaLine[1])
        } else if (investLines) {
          for (const line of investLines) {
            valorTotal += extractReais(line)
          }
        }

        // URL: **Página:** or **URL:**
        const urlMatch = content.match(/\*\*(?:Página|Pagina|URL):\*\*\s*(https?:\/\/\S+)/i)
        const url = urlMatch ? urlMatch[1] : ''

        // Follow-up: extract D+5, D+10, D+15 dates (dd/mm format)
        const followUps = []
        const fuMatches = content.matchAll(/D\+(\d+)\s*\((\d{2}\/\d{2})\)/g)
        for (const m of fuMatches) {
          followUps.push({ days: parseInt(m[1]), date: `2026-${m[2].split('/').reverse().join('-')}` })
        }
        // Sort and take next upcoming
        const nextFollowUp = followUps.length > 0
          ? followUps.sort((a, b) => a.date.localeCompare(b.date))[0]
          : null

        // Status from header
        const statusMatch = content.match(/\*\*Status:\*\*\s*([^|*]+)/i)
        const status = statusMatch ? statusMatch[1].trim() : 'Ativa'

        propostas.push({
          id: file.replace('.md', ''),
          lead,
          empresa,
          valor: Math.round(valorTotal),
          data,
          url,
          followUp: nextFollowUp ? nextFollowUp.date : '',
          followUpDays: nextFollowUp ? nextFollowUp.days : null,
          status
        })
      } catch {
        // skip malformed files
      }
    }

    // Most recent first
    return propostas.sort((a, b) => b.data.localeCompare(a.data))
  } catch {
    return []
  }
}

/**
 * Parse the ## Automações table from the operations pin.
 * Returns array of { nome, schedule, sessao, entrega, descricao, disabled }
 */
function parseCrons(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Find the Automações section
    const sectionMatch = content.match(/## Automa[çc][õo]es[\s\S]*?\n\|[^\n]+\|\n\|[-| ]+\|\n([\s\S]*?)(?=\n---|\n## |\n$)/)
    if (!sectionMatch) return []

    const lines = sectionMatch[1].split('\n').filter(l => l.trim().startsWith('|'))

    return lines.map(line => {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length < 5) return null

      const descricao = cells[4] || ''
      const disabled = /DESABILITAD[OA]/i.test(descricao) || /DESABILITAD[OA]/i.test(cells[0])

      return {
        nome: cells[0],
        schedule: cells[1],
        sessao: cells[2],
        entrega: cells[3],
        descricao: descricao.replace(/\s*\(DESABILITAD[OA].*?\)/gi, '').trim(),
        disabled
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

module.exports = {
  parseJSONL,
  parseSpecProgress,
  parsePinAgents,
  parseHeartbeat,
  aggregateFinanceiro,
  parseComercial,
  parsePropostas,
  parseCrons
}
