export type QuestionerRow = {
  council_session_id: string;
  questioner_name: string;
};

/**
 * 定例会ごとの質問者数を数える。
 *
 * general_questions の一意制約は (council_session_id, session_day, question_order)
 * なので、同じ議員が1つの定例会で複数回質問するとレコードが複数になる。
 * 議員数として数えるため、氏名で重複を除いて集計する。
 */
export function countQuestionersBySession(
  rows: QuestionerRow[]
): Map<string, number> {
  const namesBySession = new Map<string, Set<string>>();

  for (const row of rows) {
    const names = namesBySession.get(row.council_session_id);
    if (names) {
      names.add(row.questioner_name);
    } else {
      namesBySession.set(
        row.council_session_id,
        new Set([row.questioner_name])
      );
    }
  }

  return new Map(
    [...namesBySession].map(([sessionId, names]) => [sessionId, names.size])
  );
}
