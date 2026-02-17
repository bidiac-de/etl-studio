# Studio-Core Compatibility Matrix and Upgrade Guide

## Compatibility Matrix

| Capability | Core Contract Requirement | Required by Studio | Notes |
|---|---|---|---|
| Bootstrap handshake | `GET /setup/capabilities` | Yes | Must return `contract_version=core-studio-v1` |
| Setup key validation | `POST /setup/validate` | Conditional | Used when `setup_validation.required=true` |
| Dynamic component catalog | `GET /configs/component_types` + `/configs/{comp_type}/form` + `/full` | Yes | No static fallback list |
| Dynamic rules/operators/types | capabilities payload (`rule_operators`, `rule_logical_operators`, `data_types`) | Yes | UI options are runtime-driven |
| Context-aware component fields | `GET /contexts/` + `x-ui.context_selector` | Yes | Required for DB and context-bound components |
| Job CRUD | `/jobs/*` | Yes | Studio editor depends on these endpoints |
| Job start | `POST /execution/{job_id}` | Yes | Called from execution menu |
| Canonical error envelope | `{"error": {code, message, details, context}}` | Yes | Studio error UI expects one stable shape |

## Contract Rules

1. Studio must successfully load capabilities before normal API requests.
2. Contract mismatch must hard-block UI (no degraded mode).
3. Studio must not hardcode environments/operators/data types.
4. Component forms must render from Core schema metadata only.

## Upgrade Checklist

1. Upgrade Core and ensure `GET /setup/capabilities` returns the expected contract version.
2. Verify `POST /setup/validate` behavior for both modes:
- `setup_validation.required=false` (no key)
- `setup_validation.required=true` (shared key)
3. Verify each target component schema returns `x-ui` and `x-class`.
4. Verify Studio can render dynamic fields (`array/object` and dynamic ports) from schema.
5. Run Studio test suite and check coverage gate passes.

## Rollback Notes

- If Core and Studio versions diverge, Studio will block by design.
- Rollback should be done by deploying matching Core+Studio versions together.
