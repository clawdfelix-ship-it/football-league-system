import { describe, expect, it } from 'vitest';
import { apiJson } from '@/lib/api/client';

describe('apiJson', () => {
  it('returns data on ok envelope', async () => {
    const res = new Response(JSON.stringify({ ok: true, data: { value: 123 } }), {
      headers: { 'content-type': 'application/json' },
    });
    await expect(apiJson<{ value: number }>(res)).resolves.toEqual({ value: 123 });
  });

  it('throws on fail envelope', async () => {
    const res = new Response(
      JSON.stringify({ ok: false, error: { code: 'NO', message: 'nope' } }),
      { headers: { 'content-type': 'application/json' }, status: 400 }
    );
    await expect(apiJson(res)).rejects.toThrow('nope');
  });

  it('throws on invalid shape', async () => {
    const res = new Response(JSON.stringify({ hello: 'world' }), {
      headers: { 'content-type': 'application/json' },
    });
    await expect(apiJson(res)).rejects.toThrow('Invalid API response');
  });
});
