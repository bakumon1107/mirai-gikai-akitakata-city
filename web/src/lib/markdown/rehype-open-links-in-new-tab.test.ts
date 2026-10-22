import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { rehypeOpenLinksInNewTab } from "./rehype-open-links-in-new-tab";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeOpenLinksInNewTab)
  .use(rehypeStringify);

describe("rehypeOpenLinksInNewTab", () => {
  it("外部リンクにtarget='_blank'とrel='noopener noreferrer'を追加する", async () => {
    const result = await processor.process("[External](https://example.com)");

    expect(result.toString()).toBe(
      `<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a></p>`
    );
  });

  it("内部リンクにも同じ属性を追加する", async () => {
    const result = await processor.process("[Internal](/bills)");

    expect(result.toString()).toBe(
      `<p><a href="/bills" target="_blank" rel="noopener noreferrer">Internal</a></p>`
    );
  });
});
