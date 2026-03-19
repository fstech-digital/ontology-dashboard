const path = require('path')
const fs = require('fs')
const { execFileSync } = require('child_process')
const {
  parsePinAgents,
  parseHeartbeat,
  parseSpecProgress,
  aggregateFinanceiro,
  parseComercial,
  parsePropostas,
  parseCrons
} = require('../../lib/parsers')
const { getDashboardConfig, isParserEnabled, getProjectAllowlist } = require('../../lib/config')

// Ontology root — parent of dashboard/
const ONTOLOGY_PATH = process.env.ONTOLOGY_PATH || path.resolve(process.cwd(), '..')

import { checkAuth } from '../../lib/auth'

export default function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    const config = getDashboardConfig()

    // 1. Agents from operations pin
    let agents = []
    if (isParserEnabled('agents')) {
      const pinFile = config.parsers?.agents?.file || 'pins/operations-pin.md'
      const pinPath = path.join(ONTOLOGY_PATH, pinFile)
      agents = parsePinAgents(pinPath)
    }

    // 2. Crons from operations pin
    let crons = []
    if (isParserEnabled('crons')) {
      const pinFile = config.parsers?.crons?.file || 'pins/operations-pin.md'
      const pinPath = path.join(ONTOLOGY_PATH, pinFile)
      crons = parseCrons(pinPath)
    }

    // 3. Heartbeat tasks
    let heartbeat = { pending: 0, done: 0, pendingItems: [] }
    if (isParserEnabled('heartbeat')) {
      const hbFile = config.parsers?.heartbeat?.file || 'HEARTBEAT.md'
      const heartbeatPath = path.join(ONTOLOGY_PATH, hbFile)
      heartbeat = parseHeartbeat(heartbeatPath)
    }

    // 4. Commercial pipeline
    let leads = [], activities = []
    if (isParserEnabled('comercial')) {
      const result = parseComercial(ONTOLOGY_PATH)
      leads = result.leads
      activities = result.activities
    }

    // 5. Financial data
    let financeiro = { months: [] }
    let receitaYTD = 0
    let receitaMensal = 0
    if (isParserEnabled('financeiro')) {
      financeiro = aggregateFinanceiro(ONTOLOGY_PATH)
      const now = new Date()
      const currentYear = `${now.getFullYear()}-`
      const ytdMonths = financeiro.months.filter(m => m.month.startsWith(currentYear))
      receitaYTD = ytdMonths.reduce((sum, m) => sum + m.receita, 0)
      const lastMonthWithData = financeiro.months.length > 0 ? financeiro.months[financeiro.months.length - 1] : null
      receitaMensal = lastMonthWithData ? lastMonthWithData.receita : 0
    }

    // 6. Propostas ativas
    let propostas = []
    let propostasPipelineTotal = 0
    if (isParserEnabled('propostas')) {
      propostas = parsePropostas(ONTOLOGY_PATH)
      propostasPipelineTotal = propostas.reduce((sum, p) => sum + p.valor, 0)
    }

    // 7. Project specs progress (config-driven allowlist)
    let projects = []
    if (isParserEnabled('projects')) {
      const projectsDir = path.join(ONTOLOGY_PATH, config.parsers?.projects?.dir || 'projects')
      try {
        const allowlist = getProjectAllowlist()
        const projectFolders = fs.readdirSync(projectsDir).filter(d => {
          if (allowlist.length > 0 && !allowlist.some(a => d.includes(a.match))) return false
          try { return fs.statSync(path.join(projectsDir, d)).isDirectory() } catch { return false }
        })

        // Build display name map from config
        const nameMap = {}
        for (const a of allowlist) {
          nameMap[a.match] = a.displayName
        }

        projects = projectFolders
          .map(d => {
            const p = parseSpecProgress(path.join(projectsDir, d, '_specs.md'))
            if (!p) return null
            const alias = Object.entries(nameMap).find(([k]) => d.includes(k))
            if (alias) p.name = alias[1]
            return p
          })
          .filter(Boolean)
          .filter(p => p.total > 0)
          .sort((a, b) => b.percentage - a.percentage)
      } catch { /* projetos dir missing */ }
    }

    // 8. Git log (recent commits)
    let gitLog = []
    if (isParserEnabled('gitlog')) {
      try {
        const limit = config.parsers?.gitlog?.limit || 15
        const log = execFileSync('git', ['log', '--oneline', `-${limit}`], {
          cwd: ONTOLOGY_PATH,
          encoding: 'utf-8',
          timeout: 5000
        })
        gitLog = log.trim().split('\n').map(line => {
          const [hash, ...rest] = line.split(' ')
          return { hash, message: rest.join(' ') }
        })
      } catch {
        // git not available or not a repo
      }
    }

    res.status(200).json({
      timestamp: new Date().toISOString(),
      instance: config.instance || {},
      agents,
      crons,
      heartbeat,
      leads,
      activities,
      financeiro,
      receitaMensal,
      receitaYTD,
      propostas,
      propostasPipelineTotal,
      projects,
      gitLog
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
