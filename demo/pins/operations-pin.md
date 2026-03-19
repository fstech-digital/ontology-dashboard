# Operations Pin — Demo Instance

## Agent Hierarchy

| Agent | Runtime | Role | Channels |
|-------|---------|------|----------|
| **Dashboard** | Next.js | Operations dashboard | Web UI |
| **Assistant** | Claude API | AI chat assistant | Dashboard chat |

## Automations

| Name | Schedule | Session | Delivery | Description |
|------|----------|---------|----------|-------------|
| daily-report | 08:00 BRT | isolated | email | Daily operational summary |
| weekly-review | Sun 20:00 | isolated | dashboard | Weekly metrics compilation |
| health-check | */30 * * * * | isolated | log | System health monitoring |
