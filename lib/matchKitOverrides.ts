export function getMatchKitOverrideColorValue(matchId: number, teamName: string): string | null {
  const normalized = teamName.trim().toUpperCase();
  const byTeam = MATCH_KIT_OVERRIDES[matchId];
  if (!byTeam) return null;
  return byTeam[normalized] ?? null;
}

const MATCH_KIT_OVERRIDES: Record<number, Record<string, string>> = {
  45: { NOMURA: 'red' },
};

