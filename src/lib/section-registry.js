/**
 * Section Registry — maps section IDs from dashboard.config.json to React components.
 *
 * Pattern inspired by Palantir Pilot's App Builder agent:
 * Config defines WHAT sections to show, registry resolves HOW to render them.
 *
 * To add a new section:
 *   1. Create component in src/components/sections/
 *   2. Register it here with a unique ID
 *   3. Add the ID to dashboard.config.json sections[]
 */

import WelcomeSection from '../components/sections/WelcomeSection'
import HeartbeatSection from '../components/sections/HeartbeatSection'
import ProjectsSection from '../components/sections/ProjectsSection'
import CronsSection from '../components/sections/CronsSection'
import FinanceiroSection from '../components/sections/FinanceiroSection'
import PipelineSection from '../components/sections/PipelineSection'
import PropostasSection from '../components/sections/PropostasSection'
import GitLogSection from '../components/sections/GitLogSection'

const SECTION_REGISTRY = {
  welcome:    WelcomeSection,
  stats:      null,  // stats is embedded in WelcomeSection (combined for layout coherence)
  heartbeat:  HeartbeatSection,
  projects:   ProjectsSection,
  crons:      CronsSection,
  financeiro: FinanceiroSection,
  pipeline:   PipelineSection,
  propostas:  PropostasSection,
  gitlog:     GitLogSection
}

/**
 * Resolve enabled sections from config into renderable components.
 * Returns array of { id, Component } for enabled sections.
 */
export function resolveSections(configSections) {
  if (!configSections || configSections.length === 0) {
    // Default: all sections in registry order
    return Object.entries(SECTION_REGISTRY)
      .filter(([, Component]) => Component !== null)
      .map(([id, Component]) => ({ id, Component }))
  }

  return configSections
    .filter(s => s.enabled !== false)
    .map(s => ({
      id: s.id,
      Component: SECTION_REGISTRY[s.id] || null
    }))
    .filter(s => s.Component !== null)
}

export default SECTION_REGISTRY
