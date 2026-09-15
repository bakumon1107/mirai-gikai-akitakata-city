/**
 * 非公開提出時のご意見の取り扱いを説明する文言を組み立てる
 *
 * 公開/非公開の確認モーダル2箇所で同一の文言を表示するため、片方だけ修正が
 * 取り残される事故を防ぐ目的で共通化している。
 *
 * 政党が運営するサイトでは政党名を差し込み、非公式運営（政党名が未設定）の
 * 場合は政党名を含む句ごと省いた汎用表現にする。
 */
export function buildPrivateSubmissionNotice(managingParty: string): string {
  const party = managingParty.trim();

  return party
    ? `非公開で提出した場合でも、ご意見は${party}の政策検討に活用させていただきます。`
    : "非公開で提出した場合でも、ご意見は政策検討に活用させていただきます。";
}
