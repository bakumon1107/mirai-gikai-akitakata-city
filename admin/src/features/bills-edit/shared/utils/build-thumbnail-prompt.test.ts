import { describe, expect, it } from "vitest";
import { buildThumbnailPrompt } from "./build-thumbnail-prompt";

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
});
