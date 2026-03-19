const fs = require('fs')
const path = require('path')
const { checkAuth } = require('../../lib/auth')

const ONTOLOGY_PATH = process.env.ONTOLOGY_PATH || path.resolve(process.cwd(), '..')

function safePath(relativePath) {
  const resolved = path.resolve(ONTOLOGY_PATH, relativePath || '.')
  if (!resolved.startsWith(ONTOLOGY_PATH)) {
    return null
  }
  return resolved
}

export default function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // POST = write operation
  if (req.method === 'POST') {
    const { path: relPath, content } = req.body || {}
    if (!relPath || typeof content !== 'string') {
      return res.status(400).json({ error: 'Missing path or content' })
    }
    if (content.length > 2 * 1024 * 1024) {
      return res.status(413).json({ error: 'Content too large (max 2MB)' })
    }
    const absPath = safePath(relPath)
    if (!absPath) {
      return res.status(403).json({ error: 'Path traversal blocked' })
    }
    try {
      if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
        return res.status(400).json({ error: 'Cannot write to a directory' })
      }
      fs.writeFileSync(absPath, content, 'utf-8')
      const stat = fs.statSync(absPath)
      return res.json({ ok: true, path: relPath, size: stat.size })
    } catch (err) {
      console.error('Files API write error:', err)
      return res.status(500).json({ error: err.message })
    }
  }

  const { op = 'list', path: relPath = '' } = req.query

  const absPath = safePath(relPath)
  if (!absPath) {
    return res.status(403).json({ error: 'Path traversal blocked' })
  }

  try {
    switch (op) {
      case 'list': {
        if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) {
          return res.status(404).json({ error: 'Directory not found' })
        }
        const entries = fs.readdirSync(absPath, { withFileTypes: true })
        const items = entries
          .filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.next')
          .map(e => {
            const fullPath = path.join(absPath, e.name)
            const stat = fs.statSync(fullPath)
            return {
              name: e.name,
              type: e.isDirectory() ? 'directory' : 'file',
              size: e.isDirectory() ? null : stat.size,
              mtime: stat.mtime.toISOString(),
              extension: e.isDirectory() ? null : path.extname(e.name).slice(1)
            }
          })
          .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
            return a.name.localeCompare(b.name)
          })
        return res.json({ path: relPath || '.', items })
      }

      case 'read': {
        if (!fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) {
          return res.status(404).json({ error: 'File not found' })
        }
        const stat = fs.statSync(absPath)
        if (stat.size > 2 * 1024 * 1024) {
          return res.status(413).json({ error: 'File too large (max 2MB)' })
        }
        const content = fs.readFileSync(absPath, 'utf-8')
        return res.json({
          path: relPath,
          name: path.basename(absPath),
          content,
          size: stat.size,
          mtime: stat.mtime.toISOString()
        })
      }

      case 'download': {
        if (!fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) {
          return res.status(404).json({ error: 'File not found' })
        }
        const fileName = path.basename(absPath)
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        res.setHeader('Content-Type', 'application/octet-stream')
        const stream = fs.createReadStream(absPath)
        stream.pipe(res)
        return
      }

      default:
        return res.status(400).json({ error: `Unknown operation: ${op}` })
    }
  } catch (err) {
    console.error('Files API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
