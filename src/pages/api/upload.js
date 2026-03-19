const fs = require('fs')
const path = require('path')
const { formidable } = require('formidable')
const { checkAuth } = require('../../lib/auth')

const ONTOLOGY_PATH = process.env.ONTOLOGY_PATH || path.resolve(process.cwd(), '..')

export const config = {
  api: { bodyParser: false }
}

function safePath(relativePath) {
  const resolved = path.resolve(ONTOLOGY_PATH, relativePath || '.')
  if (!resolved.startsWith(ONTOLOGY_PATH)) {
    return null
  }
  return resolved
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 1
  })

  try {
    const [fields, files] = await form.parse(req)
    const destDir = (fields.path && fields.path[0]) || '.'
    const absDir = safePath(destDir)

    if (!absDir) {
      return res.status(403).json({ error: 'Path traversal blocked' })
    }

    const uploadedFile = files.file && files.file[0]
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' })
    }

    fs.mkdirSync(absDir, { recursive: true })
    const safeName = path.basename(uploadedFile.originalFilename || 'uploaded-file')
    const destPath = path.join(absDir, safeName)

    // Check destination is still within ontology
    if (!destPath.startsWith(ONTOLOGY_PATH)) {
      return res.status(403).json({ error: 'Path traversal blocked' })
    }

    fs.copyFileSync(uploadedFile.filepath, destPath)
    fs.unlinkSync(uploadedFile.filepath)

    return res.json({
      success: true,
      path: path.relative(ONTOLOGY_PATH, destPath),
      size: uploadedFile.size
    })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message })
  }
}
