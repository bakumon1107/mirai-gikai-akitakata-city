import { describe, expect, it } from "vitest";
import {
  buildThumbnailPrompt,
  stripMarkdown,
  truncateContent,
} from "./build-thumbnail-prompt";

describe("buildThumbnailPrompt", () => {
  it("議案名がプロンプトに含まれる", () => {
    const billName = "防衛省の職員の給与等に関する法律の一部を改正する法律案";
    const prompt = buildThumbnailPrompt(billName);
    expect(prompt).toContain(billName);
  });

  it("テキスト禁止の指示が含まれる", () => {
    const prompt = buildThumbnailPrompt("テスト議案");
    expect(prompt).toMatch(/no text/i);
  });

  it("ランドスケープ指定が含まれる", () => {
    const prompt = buildThumbnailPrompt("テスト議案");
    expect(prompt).toMatch(/landscape/i);
  });

  it("billContextが渡された場合プロンプトに含まれる", () => {
    const prompt = buildThumbnailPrompt(
      "テスト議案",
      "この議案は市民の安全を守るための条例です。"
    );
    expect(prompt).toContain("Bill context");
    expect(prompt).toContain("市民の安全を守るための条例");
  });

  it("billContextが空の場合はコンテキストブロックが含まれない", () => {
    const prompt = buildThumbnailPrompt("テスト議案", "");
    expect(prompt).not.toContain("Bill context");
  });

  it("maxPromptLengthを超えない", () => {
    const longContent = "あ".repeat(5000);
    const prompt = buildThumbnailPrompt("テスト議案", longContent, 4000);
    expect(prompt.length).toBeLessThanOrEqual(4000);
  });
});

describe("stripMarkdown", () => {
  it("見出しを除去する", () => {
    expect(stripMarkdown("## 概要")).toBe("概要");
  });

  it("リンクをテキストのみにする", () => {
    expect(stripMarkdown("[リンク](https://example.com)")).toBe("リンク");
  });

  it("強調を除去する", () => {
    expect(stripMarkdown("**太字**と*斜体*")).toBe("太字と斜体");
  });

  it("リスト記号を除去する", () => {
    expect(stripMarkdown("- 項目1\n- 項目2")).toBe("項目1\n項目2");
  });
});

describe("truncateContent", () => {
  it("maxLength以下のテキストはそのまま返す", () => {
    expect(truncateContent("短いテキスト", 100)).toBe("短いテキスト");
  });

  it("maxLengthを超えるテキストは切り詰めて...を付ける", () => {
    const text = "あ".repeat(10);
    expect(truncateContent(text, 5)).toBe("あああああ...");
  });
});
