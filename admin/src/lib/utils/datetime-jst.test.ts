import { describe, expect, it } from "vitest";
import { jstDatetimeLocalToUtc, utcToJstDatetimeLocal } from "./datetime-jst";

describe("utcToJstDatetimeLocal", () => {
  it("UTC 06:00 を JST 15:00 に変換する", () => {
    const result = utcToJstDatetimeLocal("2026-02-11T06:00:00Z");
    expect(result).toBe("2026-02-11T15:00");
  });

  it("UTC 15:00 を JST 翌日 00:00 に変換する", () => {
    const result = utcToJstDatetimeLocal("2026-02-11T15:00:00Z");
    expect(result).toBe("2026-02-12T00:00");
  });

  it("UTC 00:00 を JST 09:00 に変換する", () => {
    const result = utcToJstDatetimeLocal("2026-01-01T00:00:00Z");
    expect(result).toBe("2026-01-01T09:00");
  });
});

describe("jstDatetimeLocalToUtc", () => {
  it("JST 15:00 を UTC 06:00 に変換する", () => {
    const result = jstDatetimeLocalToUtc("2026-02-11T15:00");
    expect(result).toBe("2026-02-11T06:00:00.000Z");
  });

  it("JST 00:00 を UTC 前日 15:00 に変換する", () => {
    const result = jstDatetimeLocalToUtc("2026-02-12T00:00");
    expect(result).toBe("2026-02-11T15:00:00.000Z");
  });

  it("JST 09:00 を UTC 00:00 に変換する", () => {
    const result = jstDatetimeLocalToUtc("2026-01-01T09:00");
    expect(result).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("往復変換", () => {
  it("UTC → JST → UTC で元の値に戻る", () => {
    const original = "2026-02-11T06:00:00.000Z";
    const jst = utcToJstDatetimeLocal(original);
    const backToUtc = jstDatetimeLocalToUtc(jst);
    expect(backToUtc).toBe(original);
  });
});
