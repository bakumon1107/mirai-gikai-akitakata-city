import { describe, expect, it } from "vitest";
import type { BillWithContent } from "../types";
import { selectBillsForDisplay } from "./select-bills-for-display";

/** テスト用の議案を作成するヘルパー */
function makeBill(
  id: string,
  opts?: { thumbnailUrl?: string }
): BillWithContent {
  return {
    id,
    thumbnail_url: opts?.thumbnailUrl ?? null,
    tags: [],
  } as unknown as BillWithContent;
}

// 決定論的なランダム関数（テストの再現性のため）
const deterministicRandom = () => 0.5;

describe("selectBillsForDisplay", () => {
  describe("3件以下の場合", () => {
    it("全て掲載し、showMoreLinkはfalse", () => {
      const bills = [makeBill("1"), makeBill("2"), makeBill("3")];
      const result = selectBillsForDisplay(
        bills,
        new Set(),
        deterministicRandom
      );
      expect(result.displayBills).toHaveLength(3);
      expect(result.showMoreLink).toBe(false);
    });

    it("1件でもそのまま表示", () => {
      const bills = [makeBill("1")];
      const result = selectBillsForDisplay(
        bills,
        new Set(),
        deterministicRandom
      );
      expect(result.displayBills).toHaveLength(1);
      expect(result.showMoreLink).toBe(false);
    });
  });

  describe("4件以上の場合", () => {
    it("3件を選択し、showMoreLinkはtrue", () => {
      const bills = [
        makeBill("1"),
        makeBill("2"),
        makeBill("3"),
        makeBill("4"),
      ];
      const result = selectBillsForDisplay(
        bills,
        new Set(),
        deterministicRandom
      );
      expect(result.displayBills).toHaveLength(3);
      expect(result.showMoreLink).toBe(true);
    });

    it("注目議案は除外される", () => {
      const bills = [
        makeBill("1"),
        makeBill("2"),
        makeBill("3"),
        makeBill("4"),
        makeBill("5"),
      ];
      const featuredIds = new Set(["1", "2"]);
      const result = selectBillsForDisplay(
        bills,
        featuredIds,
        deterministicRandom
      );
      const selectedIds = result.displayBills.map((b) => b.id);
      expect(selectedIds).not.toContain("1");
      expect(selectedIds).not.toContain("2");
      expect(result.displayBills).toHaveLength(3);
    });

    it("画像付き議案が優先される", () => {
      const bills = [
        makeBill("img1", { thumbnailUrl: "https://example.com/1.jpg" }),
        makeBill("img2", { thumbnailUrl: "https://example.com/2.jpg" }),
        makeBill("no-img1"),
        makeBill("no-img2"),
        makeBill("no-img3"),
      ];
      const result = selectBillsForDisplay(
        bills,
        new Set(),
        deterministicRandom
      );
      const selectedIds = result.displayBills.map((b) => b.id);
      // 画像付き2件は必ず含まれる
      expect(selectedIds).toContain("img1");
      expect(selectedIds).toContain("img2");
      expect(result.displayBills).toHaveLength(3);
    });

    it("画像付きが4件以上の場合はそこからランダム3件", () => {
      const bills = [
        makeBill("img1", { thumbnailUrl: "https://example.com/1.jpg" }),
        makeBill("img2", { thumbnailUrl: "https://example.com/2.jpg" }),
        makeBill("img3", { thumbnailUrl: "https://example.com/3.jpg" }),
        makeBill("img4", { thumbnailUrl: "https://example.com/4.jpg" }),
        makeBill("no-img1"),
      ];
      const result = selectBillsForDisplay(
        bills,
        new Set(),
        deterministicRandom
      );
      // 全て画像付きから選ばれる
      for (const bill of result.displayBills) {
        expect(bill.thumbnail_url).not.toBeNull();
      }
      expect(result.displayBills).toHaveLength(3);
    });

    it("注目議案除外後に3件以下になった場合は全て表示", () => {
      const bills = [
        makeBill("1"),
        makeBill("2"),
        makeBill("3"),
        makeBill("4"),
      ];
      // 2件除外で残り2件
      const featuredIds = new Set(["1", "2"]);
      const result = selectBillsForDisplay(
        bills,
        featuredIds,
        deterministicRandom
      );
      expect(result.displayBills).toHaveLength(2);
      expect(result.showMoreLink).toBe(true);
    });
  });
});
