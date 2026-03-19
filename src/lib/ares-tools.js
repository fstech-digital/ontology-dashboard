const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const { ONTOLOGY_PATH } = require('./ares-context')

function safePath(relativePath) {
  const resolved = path.resolve(ONTOLOGY_PATH, relativePath)
  if (!resolved.startsWith(ONTOLOGY_PATH)) {
    throw new Error('Path traversal blocked')
  }
  return resolved
}

const toolDefinitions = [
  {
    name: 'read_file',
    description: 'Read the contents of a file in the workspace. Use relative paths.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative file path' }
      },
      required: ['path']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and directories in the workspace.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative directory path (default: root)' }
      },
      required: []
    }
  },
  {
    name: 'ontology_search',
    description: 'Search text across workspace files (recursive grep).',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text or regex to search' },
        glob: { type: 'string', description: 'File filter (e.g. "*.md", "*.jsonl"). Default: all' }
      },
      required: ['query']
    }
  }
]

function executeTool(name, input) {
  try {
    switch (name) {
      case 'read_file': {
        const filePath = safePath(input.path)
        const content = fs.readFileSync(filePath, 'utf-8')
        if (content.length > 50000) {
          return content.slice(0, 50000) + '\n\n[... truncated at 50k chars]'
        }
        return content
      }

      case 'list_directory': {
        const dirPath = safePath(input.path || '.')
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        return entries.map(e => {
          const type = e.isDirectory() ? 'dir' : 'file'
          let size = ''
          if (!e.isDirectory()) {
            try {
              const stat = fs.statSync(path.join(dirPath, e.name))
              size = ` (${stat.size} bytes)`
            } catch {}
          }
          return `[${type}] ${e.name}${size}`
        }).join('\n')
      }

      case 'ontology_search': {
        const globPattern = input.glob || '*'
        let filesBuf
        try {
          filesBuf = execFileSync('grep', [
            '-r', '--include=' + globPattern, '-l', '-i', input.query, '.'
          ], {
            cwd: ONTOLOGY_PATH,
            timeout: 10000,
            encoding: 'utf-8',
            maxBuffer: 512 * 1024
          }).trim()
        } catch (e) {
          if (e.status === 1) return 'No results found.'
          throw e
        }

        if (!filesBuf) return 'No results found.'

        const fileList = filesBuf.split('\n').slice(0, 10)
        const results = fileList.map(f => {
          try {
            const matches = execFileSync('grep', [
              '-n', '-i', '-C', '1', input.query, f
            ], {
              cwd: ONTOLOGY_PATH,
              timeout: 5000,
              encoding: 'utf-8',
              maxBuffer: 256 * 1024
            }).trim()
            return `--- ${f} ---\n${matches}`
          } catch {
            return `--- ${f} ---\n(error reading)`
          }
        })

        return results.join('\n\n')
      }

      default:
        return `Unknown tool: ${name}`
    }
  } catch (err) {
    return `Error: ${err.message}`
  }
}

module.exports = { toolDefinitions, executeTool }
