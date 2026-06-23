import { describe, expect, it } from "vitest";
import { splitTurns } from "./split-discussion-turns";

describe("splitTurns", () => {
  it("nullを渡すと空配列を返す", () => {
    expect(splitTurns(null)).toEqual([]);
  });

  it("空文字列を渡すと空配列を返す", () => {
    expect(splitTurns("")).toEqual([]);
  });

  it("区切りなしのテキストをそのまま1要素で返す", () => {
    expect(splitTurns("質問内容")).toEqual(["質問内容"]);
  });

  it("（追加）で分割して複数ターンを返す", () => {
    expect(splitTurns("第1発言（追加）第2発言")).toEqual([
      "第1発言",
      "第2発言",
    ]);
  });

  it("3つ以上のターンを正しく分割する", () => {
    expect(splitTurns("A（追加）B（追加）C")).toEqual(["A", "B", "C"]);
  });

  it("各ターンの前後の空白をtrimする", () => {
    expect(splitTurns("  A  （追加）  B  ")).toEqual(["A", "B"]);
  });

  it("空要素はフィルタして除外する", () => {
    expect(splitTurns("（追加）B")).toEqual(["B"]);
    expect(splitTurns("A（追加）")).toEqual(["A"]);
  });
});
