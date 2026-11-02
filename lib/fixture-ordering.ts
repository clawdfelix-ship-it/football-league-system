type DatedFixture = { date: Date | string | null };

function timestamp(value: DatedFixture['date']) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function byUpcomingDate(a: DatedFixture, b: DatedFixture) {
  const ta = timestamp(a.date);
  const tb = timestamp(b.date);
  if (ta === null) return tb === null ? 0 : 1;
  if (tb === null) return -1;
  return ta - tb;
}

export function byDateDesc(a: DatedFixture, b: DatedFixture) {
  const ta = timestamp(a.date) ?? 0;
  const tb = timestamp(b.date) ?? 0;
  return tb - ta;
}
