import { ZodError } from 'zod';

export function zodDetails(error: unknown) {
  if (!(error instanceof ZodError)) return undefined;
  return error.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
  }));
}

