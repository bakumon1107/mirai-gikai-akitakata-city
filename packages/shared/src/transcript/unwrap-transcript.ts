/**
 * 議事録PDFから抽出したテキストの折り返し改行を除去するユーティリティ。
 *
 * 議事録PDFのテキストは全角約72幅の固定幅で折り返されているため、
 * そのまま表示すると文の途中で改行されてしまう。
 * 取り込み時（packages/seed）と表示時（web）の両方で使う。
 */

// 話者行頭マーク（◯ / ○ / 〇 が混在する）
export const SPEAKER_MARK_RE = /^[◯○〇]/;
// 文がここで終わっているとみなす行末の文字
const SENTENCE_END_RE = /[。！？!?」』）】\]]$/;
// 折り返し幅の推定値からこの幅以内なら「行末まで埋まっている＝折り返し」とみなす
const WRAP_TOLERANCE = 6;
// 全行のうちこの割合以上が折り返し幅に達していれば固定幅折り返しの文書と判断する。
// 折り返しのない文書（段落ごとに1行）では行幅がばらつくため、この割合は
// 分位点の定義上おおむね 0.1〜0.15 にしかならない。
const WRAPPED_LINE_RATIO = 0.3;

// 全角文字を2、半角文字を1として行の表示幅を数える
function displayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);
    width += isWide ? 2 : 1;
  }
  return width;
}

// PDFの固定幅折り返しを推定する。折り返しでない文書には null を返す。
function estimateWrapWidth(lines: string[]): number | null {
  const widths = lines
    .filter((line) => line.trim().length > 0)
    .map(displayWidth)
    .sort((a, b) => a - b);
  if (widths.length === 0) return null;

  const wrapWidth = widths[Math.floor(widths.length * 0.9)];
  const filled = widths.filter((w) => w >= wrapWidth - WRAP_TOLERANCE).length;
  if (filled / widths.length < WRAPPED_LINE_RATIO) return null;
  return wrapWidth;
}

/**
 * 議事録PDF由来の折り返し改行を除去し、論理的な段落の配列に戻す。
 *
 * - 前の行が折り返し幅まで埋まっている、または文の途中で終わっていれば、
 *   その次の行は続きとみなして連結する
 * - 段落の先頭行は続き行より1〜2文字深くインデントされるため、
 *   インデントが増えた行は連結せず新しい段落として扱う
 * - 話者マーク（◯）で始まる行は必ず段落の区切りになる
 * - 空行はページ替わりでも入るため、文が終わっている場合のみ段落の区切りとする
 * - 固定幅で折り返されていないテキストは連結せず、行をそのまま返す
 */
export function unwrapTranscriptLines(rawText: string): string[] {
  const lines = rawText.split("\n");
  const wrapWidth = estimateWrapWidth(lines);

  const paragraphs: string[] = [];
  let prevFilled = false;
  let prevEndsSentence = true;
  let prevIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      // ページ替わりの空行では字下げの基準も変わるためインデント判定を無効化する
      prevFilled = false;
      prevIndent = -1;
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const isSpeakerLine = SPEAKER_MARK_RE.test(trimmed);
    const isContinuation =
      wrapWidth !== null &&
      paragraphs.length > 0 &&
      (prevFilled || !prevEndsSentence) &&
      !isSpeakerLine &&
      !(prevIndent >= 0 && indent > prevIndent);

    if (isContinuation) {
      paragraphs[paragraphs.length - 1] += trimmed;
    } else {
      paragraphs.push(trimmed);
    }

    prevFilled =
      wrapWidth !== null && displayWidth(line) >= wrapWidth - WRAP_TOLERANCE;
    prevEndsSentence = SENTENCE_END_RE.test(trimmed);
    // 話者マーク行は話者名の分だけ字下げが崩れるためインデント判定から除外する
    prevIndent = isSpeakerLine ? -1 : indent;
  }

  return paragraphs;
}

/**
 * 折り返し改行を除去し、1段落1行のテキストに整形する。
 * DBへ raw_text を保存する際の正規化に使う。
 */
export function normalizeTranscriptText(rawText: string): string {
  return unwrapTranscriptLines(rawText).join("\n");
}
