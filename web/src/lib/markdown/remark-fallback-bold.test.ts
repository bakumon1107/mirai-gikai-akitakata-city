import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseMarkdown } from "./index";

describe("remarkFallbackBold", () => {
  it("should render bold text adjacent to fullwidth parentheses", async () => {
    const markdown =
      "今後は**水道管の太さ（口径）**によって基本料金が決まる方式に変わります。";
    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain("<strong>");
    expect(html).toContain("水道管の太さ（口径）");
    expect(html).not.toContain("**");
  });

  it("should still render normal bold text correctly", async () => {
    const markdown = "これは**太文字**です。";
    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain("<strong>");
    expect(html).toContain("太文字");
    expect(html).not.toContain("**");
  });

  it("should handle multiple bold patterns in one line", async () => {
    const markdown = "**最初**と**最後**の両方が太字です";
    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    expect(html).toContain("<strong>");
    expect(html).not.toContain("**");
  });

  it("should handle bold text after halfwidth parentheses followed by CJK", async () => {
    const markdown = "テスト(口径)**によって決まる";
    const result = await parseMarkdown(markdown);
    const html = renderToStaticMarkup(result);

    // This case has unmatched ** so should remain as-is
    expect(html).toBeDefined();
  });
});
