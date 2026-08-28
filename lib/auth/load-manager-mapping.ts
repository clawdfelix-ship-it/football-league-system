/**
 * Manager email → team index mapping loader.
 *
 * Resolution priority (highest first):
 *   1. process.env.MANAGER_MAPPING_JSON (production on Vercel)
 *   2. require('./manager-mapping.server') (gitignored local file)
 *   3. require('./manager-mapping.example') (empty placeholder for fresh clones)
 *
 * Returns empty object if nothing configured. Auth code must handle empty
 * mapping gracefully (deny unknown managers, never crash).
 */

import { createRequire } from 'node:module';
import { MANAGER_EMAILS_PLACEHOLDER } from './manager-mapping.example';

export type ManagerMapping = Record<string, number>;

const serverRequire = createRequire(typeof __filename !== 'undefined' ? __filename : import.meta.url);

let cached: ManagerMapping | null = null;

function parseEnvMapping(raw: string | undefined): ManagerMapping | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: ManagerMapping = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'number' && Number.isInteger(v)) {
          out[k.toLowerCase()] = v;
        }
      }
      return out;
    }
  } catch (e) {
    console.error('[manager-mapping] Failed to parse MANAGER_MAPPING_JSON:', e);
  }
  return null;
}

function loadServerFile(): ManagerMapping | null {
  // .server suffix convention so Next.js never bundles this into client code.
  // Wrapped in try/catch because the file may not exist on fresh clones.
  // Uses createRequire so the call is statically analyzable by webpack /
  // tree-shakers and isn't flagged by @typescript-eslint/no-require-imports.
  try {
    const mod = serverRequire('./manager-mapping.server');
    if (mod && typeof mod === 'object') {
      const out: ManagerMapping = {};
      for (const [k, v] of Object.entries(mod)) {
        if (typeof v === 'number' && Number.isInteger(v)) {
          out[k.toLowerCase()] = v;
        }
      }
      return out;
    }
  } catch {
    // file missing — fall through to placeholder
  }
  return null;
}

export function getManagerMapping(): ManagerMapping {
  if (cached) return cached;

  const envMap = parseEnvMapping(process.env.MANAGER_MAPPING_JSON);
  if (envMap) {
    cached = envMap;
    return cached;
  }

  const fileMap = loadServerFile();
  if (fileMap && Object.keys(fileMap).length > 0) {
    cached = fileMap;
    return cached;
  }

  // Placeholder may be empty (object literal), or contain fixtures.
  const placeholder: ManagerMapping = {};
  for (const [k, v] of Object.entries(MANAGER_EMAILS_PLACEHOLDER)) {
    if (typeof v === 'number' && Number.isInteger(v)) {
      placeholder[k.toLowerCase()] = v;
    }
  }
  cached = placeholder;
  return cached;
}

/**
 * Test-only hook to reset the cache between tests.
 * Do not call from production code.
 */
export function __resetManagerMappingCache(): void {
  cached = null;
}