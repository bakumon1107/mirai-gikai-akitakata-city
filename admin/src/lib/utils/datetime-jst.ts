/**
 * JST (Asia/Tokyo) とUTC間の変換ユーティリティ
 * datetime-local input はタイムゾーン情報を持たないため、
 * JST前提で正しく変換する必要がある
 */

const JST_OFFSET_MINUTES = 9 * 60;

/**
 * UTC の ISO文字列を JST の datetime-local 形式 (YYYY-MM-DDTHH:mm) に変換
 * フォーム表示時に使用
 */
export function utcToJstDatetimeLocal(utcString: string): string {
  const date = new Date(utcString);
  const jstMs = date.getTime() + JST_OFFSET_MINUTES * 60 * 1000;
  const jstDate = new Date(jstMs);
  return jstDate.toISOString().slice(0, 16);
}

/**
 * JST の datetime-local 形式 (YYYY-MM-DDTHH:mm) を UTC の ISO文字列に変換
 * フォーム送信時に使用
 */
export function jstDatetimeLocalToUtc(jstString: string): string {
  const [datePart, timePart] = jstString.split("T");
  const isoWithOffset = `${datePart}T${timePart}:00+09:00`;
  return new Date(isoWithOffset).toISOString();
}
