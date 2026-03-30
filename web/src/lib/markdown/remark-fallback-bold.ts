import type { Node, Parent } from "unist";
import { SKIP, visit } from "unist-util-visit";

/**
 * remarkプラグイン: CommonMark の emphasis parsing ルールで
 * 変換されなかった **太字** パターンを補完的に処理する。
 *
 * 原因: CJK文字＋全角括弧の組み合わせで closing ** が
 * right-flanking delimiter として認識されないケースがある。
 * 例: `（口径）**によって` — ）は句読点だが、に は句読点でも空白でもないため
 * CommonMark の right-flanking ルールを満たさない。
 */
export function remarkFallbackBold() {
  return (tree: Node) => {
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === undefined) return;

      const text = (node as Node & { value: string }).value;
      if (!text.includes("**")) return;

      const pattern = /\*\*(.+?)\*\*/g;
      let match = pattern.exec(text);
      if (!match) return;

      const newNodes: Node[] = [];
      let lastIndex = 0;

      do {
        if (match.index > lastIndex) {
          newNodes.push({
            type: "text",
            value: text.slice(lastIndex, match.index),
          } as Node);
        }

        newNodes.push({
          type: "strong",
          children: [{ type: "text", value: match[1] }],
        } as Node);

        lastIndex = match.index + match[0].length;
        match = pattern.exec(text);
      } while (match);

      if (lastIndex < text.length) {
        newNodes.push({
          type: "text",
          value: text.slice(lastIndex),
        } as Node);
      }

      (parent as Parent).children.splice(index, 1, ...newNodes);
      return [SKIP, index + newNodes.length] as const;
    });
  };
}
