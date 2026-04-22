import type { CouncilSession } from "../types";

export type SessionsByYear = {
  year: number;
  sessions: CouncilSession[];
};

/**
 * 定例会を start_date の年でグループ化する（新しい年順）
 */
export function groupSessionsByYear(
  sessions: CouncilSession[]
): SessionsByYear[] {
  const map = new Map<number, CouncilSession[]>();

  for (const session of sessions) {
    const year = new Date(session.start_date).getFullYear();
    const existing = map.get(year);
    if (existing) {
      existing.push(session);
    } else {
      map.set(year, [session]);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, sessionList]) => ({ year, sessions: sessionList }));
}

/**
 * 定例会の期間を "YYYY.M〜M" 形式でフォーマットする
 */
export function formatSessionPeriod(session: CouncilSession): string {
  const start = new Date(session.start_date);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;

  if (!session.end_date) {
    return `${startYear}.${startMonth}`;
  }

  const end = new Date(session.end_date);
  const endMonth = end.getMonth() + 1;

  if (startMonth === endMonth) {
    return `${startYear}.${startMonth}`;
  }

  return `${startYear}.${startMonth}〜${endMonth}`;
}
