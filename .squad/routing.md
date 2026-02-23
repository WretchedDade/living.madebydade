# Routing Rules

## Domain Routing

| Domain | Primary | Secondary |
|--------|---------|-----------|
| React components, UI, styling, Tailwind | Rusty | Danny |
| Convex functions, schema, backend logic | Linus | Danny |
| Plaid integration, bank linking | Linus | Danny |
| Clerk auth, user management | Linus | Danny |
| Testing, test coverage, QA | Basher | — |
| Architecture, scope, decisions | Danny | — |
| Code review, PR review | Danny | Basher |

## File Pattern Routing

| Pattern | Agent |
|---------|-------|
| `src/components/**`, `src/routes/**/*.tsx` (UI) | Rusty |
| `convex/**` | Linus |
| `src/**/*.test.*`, `tests/**` | Basher |
| `*.config.*`, `package.json` | Danny |

## Ambiguity Rules

- Full-stack features → Danny decomposes, then routes parts
- Bug reports → Danny triages, routes to domain owner
- "Team" requests → Fan out to relevant agents
