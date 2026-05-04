export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiEnvelope<T> = ApiOk<T> | ApiFail;

export async function apiJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body || typeof body !== 'object' || !('ok' in body)) {
    throw new Error('Invalid API response');
  }
  if (!body.ok) {
    const msg = body.error?.message || 'Request failed';
    throw new Error(msg);
  }
  return body.data;
}

