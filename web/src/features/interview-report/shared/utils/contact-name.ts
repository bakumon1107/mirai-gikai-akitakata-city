/**
 * 有識者への連絡主体として表示する名称を解決する
 *
 * 政党が運営するサイトでは政党名を、非公式運営（政党名が未設定）の場合は
 * 運営者名を表示する。どちらも未設定の場合は汎用表現にフォールバックする。
 */
export function resolveContactName(
  managingParty: string,
  operatorName: string
): string {
  return managingParty.trim() || operatorName.trim() || "運営者";
}
