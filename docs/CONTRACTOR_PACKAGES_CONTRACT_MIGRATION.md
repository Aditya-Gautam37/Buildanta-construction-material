# Pending contract migration — contractor packages

The structured-packages change was deployed as **expand-only**
(`20260813150000_contractor_packages_structured`). Three columns were left in
the database on purpose:

| Table | Column | Replaced by |
| --- | --- | --- |
| `ContractorPackage` | `published` | `status` |
| `ContractorPackage` | `inclusions` | `ContractorPackageInclusion` rows |
| `ContractorPackageMaterial` | `detail` | `specification` |

They are no longer read or written by application code. They exist so that the
running production build — which still referenced them at the moment the
migration ran — did not break mid-deploy.

## When to remove them

After the new code has been live and healthy for a while, and you are confident
no rollback to the previous build is needed. There is no urgency; three unused
columns cost nothing.

## How

Create a new migration containing:

```sql
DROP INDEX IF EXISTS "ContractorPackage_professionalId_published_sortOrder_idx";
ALTER TABLE "ContractorPackage" DROP COLUMN "published";
ALTER TABLE "ContractorPackage" DROP COLUMN "inclusions";
ALTER TABLE "ContractorPackageMaterial" DROP COLUMN "detail";
```

Then `prisma migrate deploy`.

## Before running it

Confirm the data really did carry across:

```sql
-- every package has a status and a slug
SELECT count(*) FROM "ContractorPackage" WHERE "slug" IS NULL;

-- inclusion rows exist for every package that had inclusion strings
SELECT p."name", array_length(p."inclusions", 1) AS old_count,
       (SELECT count(*) FROM "ContractorPackageInclusion" i WHERE i."packageId" = p."id") AS new_count
FROM "ContractorPackage" p;

-- every material has a specification
SELECT count(*) FROM "ContractorPackageMaterial" WHERE "specification" IS NULL;
```

`old_count` and `new_count` must match, and both `NULL` counts must be zero.

## Rollback note

Until this contract migration runs, rolling the application back to the previous
build still works: the old columns are intact and still populated with the data
as it stood at migration time. Any package edits made through the new admin
after that point will not be reflected in the old columns.
