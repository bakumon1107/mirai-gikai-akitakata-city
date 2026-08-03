import { describe, expect, it } from "vitest";
import { countQuestionersBySession } from "./count-questioners-by-session";

describe("countQuestionersBySession", () => {
  it("定例会ごとに質問者数を数える", () => {
    const result = countQuestionersBySession([
      { council_session_id: "s1", questioner_name: "山本数博" },
      { council_session_id: "s1", questioner_name: "新田和明" },
      { council_session_id: "s2", questioner_name: "小松かすみ" },
    ]);

    expect(result.get("s1")).toBe(2);
    expect(result.get("s2")).toBe(1);
  });

  it("同じ議員が同じ定例会で複数回質問しても1人として数える", () => {
    const result = countQuestionersBySession([
      { council_session_id: "s1", questioner_name: "山本数博" },
      { council_session_id: "s1", questioner_name: "山本数博" },
      { council_session_id: "s1", questioner_name: "新田和明" },
    ]);

    expect(result.get("s1")).toBe(2);
  });

  it("同じ議員が別の定例会で質問した場合はそれぞれ数える", () => {
    const result = countQuestionersBySession([
      { council_session_id: "s1", questioner_name: "山本数博" },
      { council_session_id: "s2", questioner_name: "山本数博" },
    ]);

    expect(result.get("s1")).toBe(1);
    expect(result.get("s2")).toBe(1);
  });

  it("空配列は空のMapを返す", () => {
    expect(countQuestionersBySession([]).size).toBe(0);
  });
});
