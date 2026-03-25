import type { BillWithContent } from "../types";

const MAX_DISPLAY_COUNT = 3;

export type BillDisplayResult = {
  /** 表示する議案 */
  displayBills: BillWithContent[];
  /** 「その他議案」リンクを表示するか（4件以上の場合） */
  showMoreLink: boolean;
};

/**
 * タグ別セクションに表示する議案を選択する
 *
 * ロジック:
 * - 3件以下: 全て掲載、「その他議案」リンクなし
 * - 4件以上: 以下の優先度で3件選択し、「その他議案」リンクあり
 *   1. 注目の議案で既に掲載済みのものを除外
 *   2. 画像付きの議案を優先
 *   3. 画像付きが4件以上あればそこからランダム
 *   4. 3件に満たなければ残りからランダムで補充
 *
 * @param bills - そのタグに紐づく全議案
 * @param featuredBillIds - 注目の議案セクションで掲載済みの議案ID
 * @param randomFn - ランダム関数（テスト用にDI可能）
 */
export function selectBillsForDisplay(
  bills: BillWithContent[],
  featuredBillIds: Set<string>,
  randomFn: () => number = Math.random
): BillDisplayResult {
  if (bills.length <= MAX_DISPLAY_COUNT) {
    return { displayBills: bills, showMoreLink: false };
  }

  // 注目の議案で掲載済みのものを除外
  const candidates = bills.filter((bill) => !featuredBillIds.has(bill.id));

  // 除外後に3件以下になった場合
  if (candidates.length <= MAX_DISPLAY_COUNT) {
    return { displayBills: candidates, showMoreLink: true };
  }

  // 画像あり/なしで分ける
  const withImage = candidates.filter((bill) => bill.thumbnail_url);
  const withoutImage = candidates.filter((bill) => !bill.thumbnail_url);

  let selected: BillWithContent[];

  if (withImage.length >= MAX_DISPLAY_COUNT) {
    // 画像付きだけで3件以上あればそこからランダム
    selected = pickRandom(withImage, MAX_DISPLAY_COUNT, randomFn);
  } else {
    // 画像付きを全て採用し、残りを画像なしから補充
    const remaining = MAX_DISPLAY_COUNT - withImage.length;
    selected = [...withImage, ...pickRandom(withoutImage, remaining, randomFn)];
  }

  return { displayBills: selected, showMoreLink: true };
}

/** 配列からランダムにcount件を選択する */
function pickRandom<T>(items: T[], count: number, randomFn: () => number): T[] {
  const shuffled = [...items].sort(() => randomFn() - 0.5);
  return shuffled.slice(0, count);
}
