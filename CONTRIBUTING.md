# Contributing

Create small changes that complete one user outcome end to end. Before review:

1. Run the build, lint, and relevant tests.
2. Verify responsive, keyboard, loading, error, and empty states.
3. Add a migration for every schema change and test it against staging data.
4. Never commit secrets, uploaded files, or production exports.
5. Document operational or permission changes in the relevant `docs/` file.

Production releases require a rollback candidate and a tested database restoration path.
