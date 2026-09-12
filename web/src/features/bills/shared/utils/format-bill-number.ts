/**
 * bill_number は案件種別を表すプレフィックスと番号の組み合わせで格納されている。
 * 例: "52" → 議案第52号 / "nin1" → 認定第1号 / "sho2" → 承認第2号
 */
export const BILL_NUMBER_PREFIXES = [
  { prefix: "nin", label: "認定" },
  { prefix: "doi", label: "同意" },
  { prefix: "sho", label: "承認" },
  { prefix: "shi", label: "諮問" },
  { prefix: "h", label: "発議" },
] as const;

/** プレフィックスなし（通常議案）のラベル */
const DEFAULT_LABEL = "議案";

/**
 * bill_number を「議案第52号」「認定第1号」のような表示用文字列に変換する。
 *
 * 番号部分は文字列のまま埋め込むので `"052"` は「議案第052号」になる。
 * 想定外の形式は前後の空白だけ落として返し、番号を失わないようにする。
 */
export function formatBillNumber(billNumber: string): string {
  const trimmed = billNumber.trim();
  if (trimmed === "") return "";

  for (const { prefix, label } of BILL_NUMBER_PREFIXES) {
    if (!trimmed.startsWith(prefix)) continue;
    const rest = trimmed.slice(prefix.length);
    if (/^\d+$/.test(rest)) {
      return `${label}第${rest}号`;
    }
  }

  if (/^\d+$/.test(trimmed)) {
    return `${DEFAULT_LABEL}第${trimmed}号`;
  }

  return trimmed;
}
