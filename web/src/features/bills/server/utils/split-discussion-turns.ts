/**
 * 議事録テキストを「（追加）」区切りで複数発言ターンに分割する
 */
export function splitTurns(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/（追加）/)
    .map((t) => t.trim())
    .filter(Boolean);
}
