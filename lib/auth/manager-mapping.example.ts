/**
 * PLACEHOLDER for team manager → team index mapping.
 *
 * SECURITY: This file SHOULD NOT contain real production emails.
 * Real mapping lives in lib/auth/manager-mapping.server.ts which is gitignored.
 *
 * Copy manager-mapping.example.ts to manager-mapping.server.ts for local dev
 * and fill in only test/fixture data.
 *
 * Format: { "email@domain.com": teamIndex }
 *   teamIndex is 0-based index into lib/constants TEAMS array:
 *     0=NOMURA, 1=BBVA, 2=LGT, 3=CACIB, 4=CITI,
 *     5=SCB, 6=UBS, 7=HSBC, 8=KPMG, 9=DEMO
 */

export const MANAGER_EMAILS_PLACEHOLDER: Record<string, number> = {
  // 'test@manager.com': 0, // NOMURA test account
};