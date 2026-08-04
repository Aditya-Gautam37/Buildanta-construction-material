# Catalogue audit — 3 August 2026

The pre-cleanup catalogue contained 203 category records but only 8 published products and 9 variants. It had two invalid numeric nodes (`1` and `2`), four duplicated display names (`Matt`, `Glossy`, `Anti-Skid`, and `Wall Hung`), a stray top-level `Flooring` node, inconsistent root slugs, and 10 uncontrolled top-level categories. No orphaned parent references were found.

The cleanup is intentionally repeatable and non-destructive:

- The canonical tree is upserted by a path-aware slug and expected parent position.
- Existing matching records are reused and re-parented.
- Non-canonical records are moved to draft instead of being deleted.
- The invalid numeric nodes are deleted only when they have no products and no children.
- Existing user-created products and uploaded images are preserved.
- The development-only sample product is moved to draft and assigned to a valid leaf category.

After cleanup, the public catalogue contains 65 deliberately ordered category nodes across 9 top-level categories, 27 complete demonstration products and 9 durable image families. The invalid numeric-node count is zero.

The demonstration prices are indicative sample data and are not live market quotations.
