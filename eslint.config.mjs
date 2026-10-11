import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Files that may legitimately import the raw DB handle directly.
// Every other app/ or components/ module must go through the tenant-scoped
// data layer (lib/queries.ts, lib/matchKitOverrides.server.ts, ...) so a query
// can never silently bypass the WHERE league_id isolation boundary.
//   - auth/* + admin user management touch the globally-keyed users /
//     password_reset_tokens tables and predate league-scoped auth (Phase 5).
//   - init-db / teams/init are admin-gated legacy bootstrap endpoints.
const RAW_DB_ALLOWLIST = [
  "app/api/admin/manager-accounts/route.ts",
  "app/api/admin/team-passwords/route.ts",
  "app/api/auth/change-password/route.ts",
  "app/api/auth/forgot-password/route.ts",
  "app/api/auth/reset-password/route.ts",
  "app/api/init-db/route.ts",
  "app/api/teams/init/route.ts",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Tenant isolation guardrail: request/UI code must not touch the raw pool.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/db", "**/lib/db"],
              message:
                "Do not import lib/db from app/components. Use a tenant-scoped helper in lib/queries.ts or lib/matchKitOverrides.server.ts (WHERE league_id). Raw db is only for the allowlisted auth/bootstrap routes.",
            },
          ],
        },
      ],
    },
  },
  // Explicit, reviewed exceptions (matched after the deny block above).
  {
    files: RAW_DB_ALLOWLIST,
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);

export default eslintConfig;
