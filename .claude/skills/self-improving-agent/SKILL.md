---
name: self-improving-agent
description: Captures learnings, errors, and corrections to enable continuous improvement across sessions
trigger: always
---

# Self-Improvement Skill

Captures learnings, errors, and corrections in structured markdown files for continuous improvement.

## When to Log

Log automatically when:
- User says "No, that's wrong..." or "Actually..." (correction)
- Commands fail with unexpected errors
- "Can you also..." or feature requests arise
- Your knowledge proves outdated
- Better approaches surface after investigation
- Non-obvious solutions discovered through debugging

## Log Files

- `.learnings/LEARNINGS.md` — corrections, knowledge gaps, best practices
- `.learnings/ERRORS.md` — command failures, exceptions, API issues
- `.learnings/FEATURE_REQUESTS.md` — user-requested capabilities

## Entry Format

```markdown
### [TYPE-YYYYMMDD-XXX] Brief Title
- **Priority:** critical | high | medium | low
- **Status:** pending | in_progress | resolved | wont_fix | promoted
- **Area:** frontend | backend | infra | tests | docs | config
- **Context:** What was happening
- **Expected:** What should have happened
- **Actual:** What actually happened
- **Fix/Learning:** The correction or insight
- **Related Files:** Affected paths
- **Recurrence-Count:** N
```

Type prefixes: `LRN` (learning), `ERR` (error), `FR` (feature request)

## Promotion Workflow

Recurring patterns (Recurrence-Count ≥ 3 across ≥ 2 tasks within 30 days) should be promoted to permanent project memory:
- Project memory files in `.claude/projects/*/memory/`
- `CLAUDE.md` for project conventions

## Best Practices

- Log immediately after discovery
- Be specific with reproduction steps
- Include concrete fix suggestions
- Link related files
- Use consistent categories
- Review learnings before major tasks
