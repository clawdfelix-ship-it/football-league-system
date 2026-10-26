import { describe, expect, it } from 'vitest';

import { buildImpersonateUrl, extractImpersonateToken } from './impersonate';

describe('buildImpersonateUrl', () => {
  it('places the token in the URL fragment instead of the query string', () => {
    expect(buildImpersonateUrl('summer-cup', 'abc123')).toBe(
      'https://summer-cup.zenex-sports.com/auth/impersonate#token=abc123'
    );
  });
});

describe('extractImpersonateToken', () => {
  it('reads the token from the fragment', () => {
    expect(extractImpersonateToken({ hash: '#token=abc123' })).toBe('abc123');
  });

  it('keeps backward compatibility with older query-string links', () => {
    expect(extractImpersonateToken({ search: '?token=legacy456' })).toBe('legacy456');
  });
});
