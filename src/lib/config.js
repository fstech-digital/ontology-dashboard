const path = require('path')
const fs = require('fs')

// process.cwd() = dashboard root in Next.js (both dev and prod)
const DASHBOARD_ROOT = process.cwd()

let _dashboardConfig = null
let _themeConfig = null

/**
 * Load dashboard.config.json (singleton, cached).
 * Falls back to sensible defaults if file missing.
 */
function getDashboardConfig() {
  if (_dashboardConfig) return _dashboardConfig

  const configPath = path.join(DASHBOARD_ROOT, 'dashboard.config.json')
  try {
    _dashboardConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    _dashboardConfig = {
      instance: { name: 'Dashboard', title: 'Dashboard', user: { name: 'User', role: '' } },
      sections: [],
      parsers: {},
      projects: { allowlist: [] },
      tools: ['read_file', 'write_file', 'list_directory'],
      layout: { topBarHeight: 48, filesWidth: 300, chatWidth: 380, minPanel: 200, maxPanel: 600, refreshInterval: 60000 }
    }
  }

  return _dashboardConfig
}

/**
 * Load theme.config.json (singleton, cached).
 * Falls back to Zed One Dark defaults.
 */
function getThemeConfig() {
  if (_themeConfig) return _themeConfig

  const dashConfig = getDashboardConfig()
  const themeFile = dashConfig.theme || 'theme.config.json'
  const themePath = path.join(DASHBOARD_ROOT, themeFile)

  try {
    _themeConfig = JSON.parse(fs.readFileSync(themePath, 'utf-8'))
  } catch {
    // Fallback: Zed One Dark hardcoded (should never happen in production)
    _themeConfig = {
      name: 'Zed One Dark (fallback)',
      colors: {
        primary: { light: '#74ade8', main: '#61afef', dark: '#4d8bc0', contrastText: '#1e2127' },
        secondary: { light: '#a9afbc', main: '#7f848e', dark: '#5c6370', contrastText: '#FFF' },
        success: { light: '#aed19b', main: '#98c379', dark: '#7a9e60', contrastText: '#1e2127' },
        warning: { light: '#ebd092', main: '#e5c07b', dark: '#bfa063', contrastText: '#1e2127' },
        error: { light: '#e88388', main: '#e06c75', dark: '#b8555d', contrastText: '#1e2127' },
        info: { light: '#82b8e0', main: '#61afef', dark: '#4d8bc0', contrastText: '#1e2127' }
      },
      backgrounds: { body: '#282c33', paper: '#2f343e', sidebar: '#21252b', hover: '#363c46', tableHeader: '#2f343e' },
      text: { primary: 'rgba(220, 224, 229, 0.92)', secondary: 'rgba(169, 175, 188, 0.72)', disabled: 'rgba(127, 132, 142, 0.50)' },
      grey: { '50': '#2f343e', '100': '#363c46', '200': '#3e4451', '300': '#464b57', '400': '#5c6370', '500': '#7f848e', '600': '#a9afbc', '700': '#c8ccd4', '800': '#dce0e5', '900': '#eceff4' },
      divider: 'rgba(70, 75, 87, 0.60)',
      action: { active: 'rgba(169, 175, 188, 0.54)', hover: 'rgba(169, 175, 188, 0.08)', selected: 'rgba(97, 175, 239, 0.12)', disabled: 'rgba(169, 175, 188, 0.26)', focus: 'rgba(97, 175, 239, 0.16)' },
      scrollbar: { width: 6, thumb: '#464b57', track: '#282c33' },
      border: { card: 'rgba(70, 75, 87, 0.50)', cardHover: 'rgba(70, 75, 87, 0.80)' },
      typography: { fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontFamilyMono: '"Fira Code", "IBM Plex Mono", monospace', borderRadius: 6 }
    }
  }

  return _themeConfig
}

/**
 * Check if a parser is enabled in config.
 */
function isParserEnabled(parserName) {
  const config = getDashboardConfig()
  const parser = config.parsers?.[parserName]
  return parser?.enabled !== false
}

/**
 * Check if a section is enabled in config.
 */
function isSectionEnabled(sectionId) {
  const config = getDashboardConfig()
  if (!config.sections || config.sections.length === 0) return true
  const section = config.sections.find(s => s.id === sectionId)
  return section?.enabled !== false
}

/**
 * Get project allowlist from config.
 */
function getProjectAllowlist() {
  const config = getDashboardConfig()
  return config.projects?.allowlist || []
}

/**
 * Clear cached configs (useful for hot reload in dev).
 */
function clearConfigCache() {
  _dashboardConfig = null
  _themeConfig = null
}

module.exports = {
  getDashboardConfig,
  getThemeConfig,
  isParserEnabled,
  isSectionEnabled,
  getProjectAllowlist,
  clearConfigCache
}
