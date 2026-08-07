# Buildanta Stage Calculator Coverage Audit

Audit date: 7 August 2026

## Current calculation paths

The storefront stage questionnaire is implemented in `app/by-stage/stage-questionnaire.tsx`. The published complete-project calculator uses `building-material-budget-v3`, seeded as version 4 in `inventory-platform/packages/database/src/seed-calculators.ts` and executed by the NestJS calculator service.

| Storefront stage | Current versioned API output | Status | Required next action |
|---|---|---|---|
| Foundation & Structure | `Foundation and structure` group | API-backed | Keep mapped to the published building calculator and verify formula coefficients with an engineer. |
| Walls & Masonry | `Structural shell` group | API-backed | Keep current mapping; add opening-aware detailed mode later. |
| Bathroom & Plumbing | `plumbing_*` outputs plus `sanitary_fixture_set` | API-backed concept mode | Managed room templates resolve fixture routes. Add explicit drawing-based schedules for detailed mode. |
| Electrical & Wiring | `electrical_*` outputs | API-backed concept mode | Managed room templates resolve point routes. Add explicit drawing-based schedules and conduit routing later. |
| Plastering & Waterproofing | None | Local fallback | Add a pure, versioned plastering/waterproofing formula and product output keys. |
| Flooring & Tiling | `Flooring and finishes` group | API-backed | Keep current concept mapping; use the specialist tile formula for measured detailed mode. |
| False Ceiling | None | Local fallback | Add a versioned board, framework, hanger, fastener, jointing and finishing formula. |
| Paint & Finishing | `Painting system` group | API-backed | Keep current concept mapping; use the specialist paint formula for measured detailed mode. |
| Doors, Windows, Railings & Glass | `Doors and windows` group | Partially API-backed | Doors and windows are covered. Add opening-schedule outputs for frames, hardware, railings and glazing. |
| Kitchen & Wardrobes | None | Local fallback | Add a versioned cabinet/joinery schedule formula based on measured running length and selected construction system. |
| Finishing | None | Local fallback | Define the business scope first, then add approved output keys and a versioned formula. |

## Important limitations

- The current by-stage API path runs the complete-project formula and filters its result by output group. It is a concept estimate, not a measured stage-specific BOQ.
- Electrical and plumbing are no longer calculated using simple square-foot rates. They are resolved from managed room point and fixture-route templates.
- Electrical conduit routing is intentionally excluded from `building-material-budget-v3` until a route model is approved.
- Missing catalogue mappings do not prevent quantity calculation.
- The legacy `app/by-stage/stage-planner.ts` remains live only for the four unsupported stages and must be removed after those stages receive published API formulas.
- No production database migration or seed was applied as part of this audit.

## Completion condition

Stage-calculator unification is complete only when all eleven live stages use published, immutable calculator versions and `stage-questionnaire.tsx` no longer imports `buildStagePlan()`.

