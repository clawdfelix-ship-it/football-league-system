import { NextResponse } from 'next/server';

export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  const body: ApiFail = details === undefined
    ? { ok: false, error: { code, message } }
    : { ok: false, error: { code, message, details } };
  return NextResponse.json(body, { status });
}

