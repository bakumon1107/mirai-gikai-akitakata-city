import { describe, expect, it } from "vitest";
import { BILL_NUMBER_PREFIXES, formatBillNumber } from "./format-bill-number";

describe("formatBillNumber", () => {
  it.each([
    ["52", "議案第52号"],
    ["8", "議案第8号"],
  ])("数字のみ %s → %s", (input, expected) => {
    expect(formatBillNumber(input)).toBe(expected);
  });

  it.each([
    ["nin1", "認定第1号"],
    ["nin15", "認定第15号"],
    ["sho2", "承認第2号"],
    ["doi3", "同意第3号"],
    ["shi4", "諮問第4号"],
    ["h5", "発議第5号"],
  ])("プレフィックス付き %s → %s", (input, expected) => {
    expect(formatBillNumber(input)).toBe(expected);
  });

  // 番号を数値化せず文字列のまま埋め込む仕様の回帰防止
  it.each([
    ["052", "議案第052号"],
    ["nin007", "認定第007号"],
    ["h0", "発議第0号"],
  ])("先頭ゼロを保持する %s → %s", (input, expected) => {
    expect(formatBillNumber(input)).toBe(expected);
  });

  it.each([
    [" nin1 ", "認定第1号"],
    [" 52 ", "議案第52号"],
  ])("前後の空白は無視する %s → %s", (input, expected) => {
    expect(formatBillNumber(input)).toBe(expected);
  });

  it("空文字は空文字を返す", () => {
    expect(formatBillNumber("")).toBe("");
    expect(formatBillNumber("   ")).toBe("");
  });

  it.each([
    "52の2",
    "nin",
    "h",
    "sho2-1",
    "h5の2",
    "追加議案",
    // 全角数字は ASCII の \d にマッチしない
    "１",
    "nin１",
  ])("想定外の形式 %s はそのまま返す", (input) => {
    expect(formatBillNumber(input)).toBe(input);
  });

  it("前後の空白のみ落として返す", () => {
    expect(formatBillNumber(" 52の2 ")).toBe("52の2");
  });

  // プレフィックスに前方一致しても、残りが数字でなければ変換しない
  it.each([
    "hosei1",
    "shitsumon1",
    "nintei1",
    "shonin1",
  ])("プレフィックスに前方一致するだけの %s は変換しない", (input) => {
    expect(formatBillNumber(input)).toBe(input);
  });
});

describe("BILL_NUMBER_PREFIXES", () => {
  // 互いに前方一致するプレフィックスがあると、定義順しだいで
  // 短い方が先に一致して誤ったラベルになる。追加時に気付けるようにする。
  it("互いに前方一致するプレフィックスが存在しない", () => {
    const prefixes = BILL_NUMBER_PREFIXES.map((p) => p.prefix);
    for (const a of prefixes) {
      for (const b of prefixes) {
        if (a === b) continue;
        expect(b.startsWith(a), `"${a}" と "${b}" が前方一致しています`).toBe(
          false
        );
      }
    }
  });

  it("ラベルが重複していない", () => {
    const labels = BILL_NUMBER_PREFIXES.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
