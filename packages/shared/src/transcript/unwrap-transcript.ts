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
// インデント別の折り返し幅を独立して推定するのに必要な行数。これに届かない
// インデントはテキスト全体の折り返し幅で判定する。
const MIN_INDENT_GROUP_LINES = 10;
// インデント別の折り返し幅を採用する条件。その幅まで埋まっている行のうち、
// 文末で終わる行がこの割合を超えるなら折り返しではなく箇条書き（議事日程・名簿など）
// とみなして採用しない。実データでは折り返しの段組みは 0〜20% に収まり、
// 箇条書きは各行が文として完結するためほぼ 100% になる。
const MAX_SENTENCE_END_RATE = 0.5;

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

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

function percentile90(sortedWidths: number[]): number {
  return sortedWidths[Math.floor(sortedWidths.length * 0.9)];
}

/**
 * PDFの固定幅折り返し幅を、行頭インデントごとに推定する。
 * 折り返しでない文書には null を返す。
 *
 * 折り返し幅をテキスト全体で1つに決めると、話者名が長い発言（「◯高下福祉保健
 * 部長兼福祉事務所長」など）のブロックだけ本文が右にずれて折り返し位置も右へ動く
 * ため、分位点がそのブロックに引っ張られて本文の大半が「行末まで埋まっていない」
 * と判定され、折り返しを検出できなくなる。インデントは段組みの左端を表すので、
 * インデントごとの分位点も段組みの候補として扱う。
 *
 * ただしインデントごとの分位点をそのまま使うと、議事日程や名簿のように短い行が
 * 同じインデントで並ぶブロックにもその幅が割り当てられ、1行ごとに完結している
 * 行まで「行末まで埋まっている＝折り返し」とみなして連結してしまう。折り返しの
 * 段組みは行が文の途中で切れるのが特徴なので、その幅まで埋まっている行の
 * 文末率を見て、箇条書きらしいインデントは段組みとして採用しない。
 */
function estimateWrapWidths(lines: string[]): Map<number, number> | null {
  const allWidths: number[] = [];
  const linesByIndent = new Map<number, string[]>();
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    allWidths.push(displayWidth(line));
    const group = linesByIndent.get(indentOf(line));
    if (group) group.push(line);
    else linesByIndent.set(indentOf(line), [line]);
  }
  if (allWidths.length === 0) return null;

  allWidths.sort((a, b) => a - b);
  // テキスト全体の折り返し位置。段組みが1つしかない文書ではこれがそのまま幅になる
  const overallWidth = percentile90(allWidths);

  const wrapWidths = new Map<number, number>();
  let filled = 0;
  for (const [indent, group] of linesByIndent) {
    const widths = group.map(displayWidth).sort((a, b) => a - b);
    const ownWidth = percentile90(widths);
    const wrapWidth =
      group.length >= MIN_INDENT_GROUP_LINES && isWrapColumn(group, ownWidth)
        ? ownWidth
        : overallWidth;
    wrapWidths.set(indent, wrapWidth);
    filled += widths.filter((w) => w >= wrapWidth - WRAP_TOLERANCE).length;
  }
  if (filled / allWidths.length < WRAPPED_LINE_RATIO) return null;
  return wrapWidths;
}

/** その幅まで埋まっている行の多くが文の途中で切れていれば折り返しの段組みとみなす */
function isWrapColumn(group: string[], wrapWidth: number): boolean {
  const atColumn = group.filter(
    (line) => displayWidth(line) >= wrapWidth - WRAP_TOLERANCE
  );
  if (atColumn.length === 0) return false;
  const endsSentence = atColumn.filter((line) =>
    SENTENCE_END_RE.test(line.trim())
  ).length;
  return endsSentence / atColumn.length <= MAX_SENTENCE_END_RATE;
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
 * - 折り返し幅は行頭インデント（段組みの左端）ごとに推定する
 * - 固定幅で折り返されていないテキストは連結せず、行をそのまま返す
 */
export function unwrapTranscriptLines(rawText: string): string[] {
  const lines = rawText.split("\n");
  const wrapWidths = estimateWrapWidths(lines);

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

    const indent = indentOf(line);
    const isSpeakerLine = SPEAKER_MARK_RE.test(trimmed);
    const isContinuation =
      wrapWidths !== null &&
      paragraphs.length > 0 &&
      (prevFilled || !prevEndsSentence) &&
      !isSpeakerLine &&
      !(prevIndent >= 0 && indent > prevIndent);

    if (isContinuation) {
      paragraphs[paragraphs.length - 1] += trimmed;
    } else {
      paragraphs.push(trimmed);
    }

    const wrapWidth = wrapWidths?.get(indent);
    prevFilled =
      wrapWidth !== undefined &&
      displayWidth(line) >= wrapWidth - WRAP_TOLERANCE;
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
