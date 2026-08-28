/**
 * Centralized role constants. Use these instead of string literals so that
 * TypeScript catches typos and we have one place to update role semantics.
 *
 * Backward compatible: existing code using the string literals ('admin' /
 * 'manager' / 'user') still compiles because the values are identical.
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export function isAdmin(role: unknown): role is 'admin' {
  return role === ROLES.ADMIN;
}

export function isManager(role: unknown): role is 'manager' {
  return role === ROLES.MANAGER;
}

export function isStaff(role: unknown): role is 'admin' | 'manager' {
  return role === ROLES.ADMIN || role === ROLES.MANAGER;
}

export function normalizeRole(role: unknown): Role | null {
  if (role === ROLES.ADMIN || role === ROLES.MANAGER || role === ROLES.USER) {
    return role;
  }
  return null;
}