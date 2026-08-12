describe('resolveCorsOrigins', () => {
  const originalEnv = process.env.CORS_ORIGINS;
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.CORS_ORIGINS;
    else process.env.CORS_ORIGINS = originalEnv;
    jest.resetModules();
  });

  // Re-required per test (via jest.resetModules) so each one sees the env
  // var set just before it — resolveCorsOrigins() has no other inputs.
  function resolve(): () => string[] {
    jest.resetModules();
    return (require('./bootstrap') as typeof import('./bootstrap')).resolveCorsOrigins;
  }

  it('parses a comma-separated allowlist', () => {
    process.env.CORS_ORIGINS = 'https://a.example, https://b.example';
    expect(resolve()()).toEqual(['https://a.example', 'https://b.example']);
  });

  it('falls back to the local dev origin when unset', () => {
    delete process.env.CORS_ORIGINS;
    expect(resolve()()).toEqual(['http://localhost:3002']);
  });

  it('refuses a wildcard origin, which credentials:true would silently break', () => {
    process.env.CORS_ORIGINS = '*';
    expect(resolve()).toThrow(/wildcard|\*/i);
  });

  it('refuses an origin that is not a bare host (e.g. carries a path)', () => {
    process.env.CORS_ORIGINS = 'https://example.com/some-path';
    expect(resolve()).toThrow(/CORS_ORIGINS/);
  });

  it('refuses an empty allowlist', () => {
    process.env.CORS_ORIGINS = '  , ,  ';
    expect(resolve()).toThrow(/empty/i);
  });
});
