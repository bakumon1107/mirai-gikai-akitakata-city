import { describe, expect, it } from "vitest";
import {
  formatSessionPeriod,
  groupSessionsByYear,
} from "./group-sessions-by-year";
import type { CouncilSession } from "../types";

function makeSession(overrides: Partial<CouncilSession>): CouncilSession {
  return {
    id: "test-id",
    name: "テスト定例会",
    slug: "test",
    council_url: null,
    start_date: "2026-01-01",
    end_date: null,
    is_active: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("groupSessionsByYear", () => {
  it("空配列を渡すと空を返す", () => {
    expect(groupSessionsByYear([])).toEqual([]);
  });

  it("同じ年のセッションを1グループにまとめる", () => {
    const sessions = [
      makeSession({ id: "1", start_date: "2026-03-01" }),
      makeSession({ id: "2", start_date: "2026-09-01" }),
    ];
    const result = groupSessionsByYear(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].year).toBe(2026);
    expect(result[0].sessions).toHaveLength(2);
  });

  it("異なる年のセッションを年ごとにグループ化する", () => {
    const sessions = [
      makeSession({ id: "1", start_date: "2025-03-01" }),
      makeSession({ id: "2", start_date: "2026-03-01" }),
    ];
    const result = groupSessionsByYear(sessions);
    expect(result).toHaveLength(2);
    expect(result[0].year).toBe(2026); // 新しい年が先
    expect(result[1].year).toBe(2025);
  });

  it("年の降順で並ぶ", () => {
    const sessions = [
      makeSession({ id: "1", start_date: "2024-01-01" }),
      makeSession({ id: "2", start_date: "2026-01-01" }),
      makeSession({ id: "3", start_date: "2025-01-01" }),
    ];
    const result = groupSessionsByYear(sessions);
    expect(result.map((g) => g.year)).toEqual([2026, 2025, 2024]);
  });
});

describe("formatSessionPeriod", () => {
  it("end_date なしの場合は 'YYYY.M' 形式", () => {
    const session = makeSession({ start_date: "2026-03-01", end_date: null });
    expect(formatSessionPeriod(session)).toBe("2026.3");
  });

  it("開始月と終了月が同じ場合は 'YYYY.M' 形式", () => {
    const session = makeSession({
      start_date: "2026-03-01",
      end_date: "2026-03-18",
    });
    expect(formatSessionPeriod(session)).toBe("2026.3");
  });

  it("開始月と終了月が異なる場合は 'YYYY.M〜M' 形式", () => {
    const session = makeSession({
      start_date: "2026-02-01",
      end_date: "2026-03-18",
    });
    expect(formatSessionPeriod(session)).toBe("2026.2〜3");
  });
});
