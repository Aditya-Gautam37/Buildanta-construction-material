# Buildanta Stage Calculator Unification — Implementation Prompt

Use this prompt with Claude, Codex, or another coding agent working inside the Buildanta repository.

## Prompt

You are working in the Buildanta construction-material platform repository. Your task is to unify the customer-facing construction-stage questionnaire with the central, API-backed, versioned calculator system.

Do not create a second calculation engine. The NestJS calculator API, its versioned formula registry, database calculator definitions, planning templates, regional profiles, coefficients, product mappings, estimates, and quotation hand-off must become the source of truth.

### Repository context

The platform currently contains:

- Public storefront at the repository root.
- Stage questionnaire UI in `app/by-stage/stage-questionnaire.tsx`.
- Legacy client calculation logic in `app/by-stage/stage-planner.ts`.
- Storefront calculator UI in `app/calculators/`.
- Storefront calculator proxy routes in `app/api/calculators/`.
- Inventory management application in `inventory-platform/apps/inventory-management`.
- NestJS calculator API in `inventory-platform/apps/nest-api/src/calculators`.
- Prisma database models and calculator seeds in `inventory-platform/packages/database`.
- Planning-template services in `inventory-platform/apps/nest-api/src/planning-templates`.

The stage questionnaire currently calls the local `buildStagePlan()` function. The primary calculator uses the NestJS API and preserves calculator versions and estimates. This split must be removed.

### Required outcome

When a customer opens any construction stage:

1. The customer sees a stage-specific guided questionnaire.
2. The questions collect only inputs relevant to that stage.
3. The storefront sends a validated request to a same-origin storefront API route.
4. The storefront route proxies the request to the NestJS calculator API.
5. The NestJS API runs a published, immutable calculator version.
6. The response contains calculated quantity, wastage, purchase quantity, unit, assumptions, confidence or estimate mode, and mapped catalogue products when available.
7. Missing product mappings do not prevent quantity calculation.
8. The customer can request a quotation even if some material lines are not yet mapped to products.
9. The saved estimate records the exact calculator definition and version used.
10. The same inputs must not be calculated independently in the browser.

### Critical questionnaire UX clarification

The required customer experience is a visual, step-by-step wizard similar in interaction pattern to a modern building-cost estimator. It must not be a dense form showing every field at once.

Do not copy Tata Steel Aashiyana branding, text, illustrations, photographs, icons, CSS, or source code. Use the supplied screenshots only as interaction and layout references. Create an original Buildanta design using Buildanta colours, typography, imagery, components, and wording.

The questionnaire must provide:

- One focused question or closely related question group per screen.
- A clear `Step X of Y` label.
- A segmented or continuous progress indicator.
- Back, Next, Skip where allowed, Save/continue later where supported, and Exit controls.
- Large, touch-friendly option cards with an image or Buildanta illustration where useful.
- Plus/minus counters for room quantities.
- Sliders with an editable numeric value for area and other bounded quantities.
- Immediate inline validation before moving to the next step.
- A short explanation of what each question means and why it affects the estimate.
- A persistent summary of previously selected values on desktop, with a collapsible summary on mobile.
- Restored answers when the customer goes back to an earlier step.
- No calculation request until all required questions are valid.
- A loading/result transition that does not lose the customer’s answers.
- Full keyboard navigation, visible focus, accessible labels, reduced-motion support, and mobile responsiveness.

The initial complete-project wizard should follow this pattern:

1. **Location and planning mode**
   - Delivery PIN code.
   - Concept estimate, detailed estimate, or drawing-based estimate.
   - Architectural plan status: ready, in progress, needs professional help, or skip for now.
2. **Area**
   - Plot area in square feet.
   - Built-up area per floor using a slider plus editable value.
   - Basement yes/no.
3. **Space requirements**
   - Visual room cards with plus/minus counters.
   - Living rooms, kitchens, bedrooms, bathrooms, dining areas, balconies, utility rooms, study, puja room, storage, garage, servant room, hall and other supported room types.
4. **Floors and structure**
   - Number of floors.
   - Residential or commercial project.
   - RCC frame or load-bearing system.
   - Floor height where relevant.
5. **Material preference**
   - Economy, Standard or Premium cards.
   - Each card explains typical product specifications for steel, cement, flooring, paint, doors/windows, bathroom fixtures and lighting.
   - These choices select compatible catalogue products and price levels; they must not change engineering quantities without an approved formula coefficient.
6. **Stage-specific questions**
   - Display only the questions needed for the selected construction stage.
   - Electrical uses room points, circuit purposes, route assumptions and conductor sizes.
   - Plumbing uses fixture counts, systems, pipe diameters and route assumptions.
   - Flooring uses surface dimensions, tile size and coverage.
   - Painting uses surface dimensions, openings, coats and coverage.
   - Other stages use their approved versioned inputs.
7. **Review**
   - Show all answers in an editable summary before calculation.
   - Let the customer return directly to any previous step.
8. **Results**
   - Stage-wise material breakdown.
   - Base quantity, wastage and purchase quantity.
   - Product recommendations by selected quality tier.
   - Indicative prices, GST and totals when mapped.
   - Clear `Mapping pending` or `Price on request` states when data is unavailable.
   - Assumptions, estimate mode, confidence level, formula version and professional disclaimer.
   - Request quotation and save/share estimate actions.

When the wizard is launched from a specific construction stage, preselect that stage and shorten the journey. Reuse known project answers saved in the current session so customers do not repeatedly enter plot area, rooms and floors. The stage journey should ask only missing shared information plus that stage’s specialist questions.

Suggested desktop layout:

```text
┌──────────────────────────────────────────────────────────────┐
│ Step 2 of 6                              Save & exit          │
│ ●━━━━━━━━●━━━━━━━━○━━━━━━━━○━━━━━━━━○━━━━━━━━○                │
├───────────────────────────┬──────────────────────────────────┤
│ Buildanta illustration or │ Question title                   │
│ relevant material image   │ Short helpful explanation       │
│                           │                                  │
│                           │ Interactive control/cards        │
│                           │                                  │
│                           │ Back                  Next →      │
└───────────────────────────┴──────────────────────────────────┘
```

On mobile, stack the illustration below the title or hide decorative imagery when needed, keep the primary action reachable, and never require horizontal scrolling.

### Safety rules

- Inspect `git status`, recent commits, active changes, and repository instructions before editing.
- Preserve all existing user and concurrent-session changes.
- Do not reset, discard, overwrite, stash, or reformat unrelated work.
- Do not push directly to `main` while another session may be editing or pushing.
- Prefer a `codex/` or other dedicated feature branch.
- Do not run database cleanup, destructive migrations, production seeds, or real-data reset scripts.
- Do not write test records to the production database.
- Do not require product mappings for a quantity formula to run or be published.
- Do not use price, product availability, or quality tier to determine engineering quantities.
- Quality tier may select a compatible product or price tier only after quantities have been calculated.
- Electrical quantities must use point and route schedules. Do not calculate wire using square feet multiplied by a wire rate.
- Plumbing quantities must use fixture schedules, pipe systems, diameters, and route lengths. Do not calculate pipe using a simple per-square-foot allowance.
- Clearly label concept estimates as preliminary. Detailed quantities require approved architectural, structural, electrical, and plumbing drawings.

### First step: audit before implementation

Produce a short mapping table covering every storefront construction stage:

| Stage | Existing API formula | Status | Required action |
|---|---|---|---|
| Foundation & Structure | Concrete/building foundation scope | Reusable or partial | Map questionnaire inputs and verify outputs |
| Walls & Masonry | Bricks/AAC blocks | Reusable or partial | Map wall and opening inputs |
| Bathroom & Plumbing | Plumbing route formula/templates | Reusable or partial | Use fixture and route schedules |
| Electrical & Wiring | Electrical point formula/templates | Reusable or partial | Use point, circuit and route schedules |
| Plastering & Waterproofing | Audit required | Missing or partial | Add a versioned formula if absent |
| Flooring & Tiling | Tiles and flooring | Reusable | Map surface and tile inputs |
| False Ceiling | Audit required | Missing or partial | Design and add a versioned formula |
| Paint & Finishing | Paint | Reusable | Map surfaces, openings and coats |
| Doors, Windows, Railings & Glass | Audit required | Missing or partial | Add opening-schedule formula |
| Kitchen & Wardrobes | Audit required | Missing or partial | Add cabinet/joinery schedule formula |
| Finishing | Audit required | Missing or partial | Define scope before implementation |

Do not claim a stage is supported merely because local browser arithmetic exists. A stage is supported only when a published API calculator version can calculate it.

### Implementation design

Create or reuse one stage-calculation API contract. A suggested request shape is:

```json
{
  "stageSlug": "foundation-structure",
  "deliveryPincode": "208001",
  "qualityTier": "STANDARD",
  "estimateMode": "CONCEPT",
  "sessionReference": "stable-idempotency-reference",
  "inputs": {
    "builtUpAreaSqFt": 1000,
    "floors": 1,
    "rooms": 4,
    "bathrooms": 2,
    "kitchens": 1,
    "projectType": "RESIDENTIAL",
    "structureSystem": "RCC_FRAME",
    "coveragePercent": 100,
    "wastagePercent": 5
  }
}
```

The actual contract may differ if the existing API already provides a better versioned shape. Reuse existing schemas and types rather than creating incompatible duplicates.

The response should provide enough information for the UI to render:

```json
{
  "reference": "estimate-reference",
  "calculator": {
    "slug": "foundation-structure",
    "version": 1
  },
  "estimateMode": "CONCEPT",
  "confidence": "PRELIMINARY",
  "items": [
    {
      "outputKey": "cement",
      "description": "OPC cement",
      "baseQuantity": 180,
      "wastageQuantity": 9,
      "purchaseQuantity": 189,
      "unitCode": "bag",
      "product": null,
      "unitPrice": null,
      "lineTotal": null,
      "mappingStatus": "PENDING"
    }
  ],
  "assumptions": [],
  "disclaimer": ""
}
```

Adapt this example to existing persisted estimate fields. Do not unnecessarily change stable API response fields.

### Formula requirements

For every formula:

- Keep the calculation function pure and deterministic.
- Validate inputs with Zod before execution.
- Store configuration and coefficients in an immutable calculator version.
- Separate base quantity, wastage, purchase quantity, pack rounding, pricing, GST, and line total.
- Preserve units and explicit unit conversions.
- Return assumptions for every non-obvious coefficient.
- Add maximum input limits to prevent abusive requests.
- Keep catalogue resolution and serviceability enrichment outside the pure formula.
- Allow an estimate to contain unmapped material lines.
- Use stable output keys so administrators can map products later.

For concept-mode electrical and plumbing estimates, resolve managed room templates into point and fixture schedules before calling the pure formula. For detailed mode, allow explicit schedules supplied from approved drawings.

### Storefront work

Refactor `app/by-stage/stage-questionnaire.tsx` so it:

- Does not import or call `buildStagePlan()` for final results.
- Displays stage-specific questions rather than one identical form for every stage.
- Submits through a same-origin route under `app/api/`.
- Shows loading, validation, API error, empty-mapping, unavailable-price, and success states.
- Preserves accessibility, keyboard usage, mobile layout, and current product links.
- Displays calculation version, estimate mode, assumptions, and disclaimer.
- Links the saved estimate to quotation creation.
- Prevents duplicate submission by using a stable session reference and disabling the submit action while pending.

Keep `stage-planner.ts` temporarily only if required for a controlled migration or fallback. Do not silently fall back to different browser-side quantities after an API error. Once all stages are migrated and tested, remove the unused local formula code and its obsolete tests in a separate, reviewable step.

### Inventory administration work

Provide staff controls for:

- Calculator definitions and draft versions.
- Formula configuration and coefficients.
- Room templates.
- Electrical point templates.
- Plumbing fixture templates.
- Regional profiles.
- Output-to-category/product/variant mappings.
- Economy, Standard and Premium product mappings.
- Formula review, approval, publishing and retirement.
- Audit history showing who changed or published a definition.

Do not allow published calculator versions to be edited in place. Create a new draft version for every change.

### Test requirements

Add tests at the correct layers:

1. Pure unit tests for every formula and boundary condition.
2. Planning-template resolution tests.
3. Calculator service tests for version selection, estimate persistence, unmapped outputs, serviceability failure and idempotency.
4. Storefront component tests for question visibility and result states.
5. Route-proxy tests for successful responses, validation errors, throttling and upstream unavailability.
6. End-to-end browser tests using a non-production staging database for:
   - Completing a stage questionnaire.
   - Receiving calculated quantities.
   - Seeing a mapped product and an unmapped line.
   - Converting the estimate into one quotation.
   - Confirming duplicate submission does not create duplicate estimates or quotations.

Do not run write-based end-to-end tests until isolated staging credentials are provided.

### Verification commands

Discover the exact package scripts first, then run the relevant equivalents of:

```powershell
npm run test:unit
npm run lint
npm run build

cd inventory-platform
pnpm --filter nest-api test -- --runInBand
pnpm --filter nest-api typecheck
pnpm --filter inventory-management test
pnpm --filter inventory-management typecheck
pnpm build
```

Do not treat a passing unit test as proof of a working end-to-end flow. Report exactly which layers were and were not verified.

### Delivery sequence

Implement in reviewable phases:

1. Audit and stage-to-formula mapping.
2. Complete and test missing API formulas.
3. Publish safe calculator definitions and versions in development/staging.
4. Add the shared stage API contract and storefront proxy.
5. Migrate stages with existing formulas.
6. Migrate electrical and plumbing using managed schedules.
7. Implement and migrate the remaining unsupported stages.
8. Remove the duplicate local calculation engine.
9. Add staging end-to-end tests.
10. Deploy to preview, validate, and only then promote to production.

Each phase must leave the existing storefront usable.

### Blockers that require the owner

Stop and request owner input only when necessary for:

- Staging database credentials.
- Staging Supabase project or storage buckets.
- Production or custom-domain ownership.
- Approval of engineering coefficients and regional profiles.
- Approval of product mappings and live catalogue prices.
- Production migration or seed authorization.
- Production deployment promotion.

Continue with safe code, unit tests, documentation, and non-production verification when these items are not required.

### Final report format

At completion, report:

- Files changed.
- Stages fully migrated.
- Stages still unsupported and why.
- Formula versions added or changed.
- Tests run and exact results.
- Database changes or migrations created, but not applied to production.
- Required environment variables.
- Manual staging checks.
- Remaining owner approvals.
- Deployment status, without claiming production deployment unless it was actually verified.

The final result must provide one trustworthy calculation path from questionnaire input to saved estimate and quotation. Do not declare the work complete while any live stage still uses independent, unversioned browser arithmetic.
