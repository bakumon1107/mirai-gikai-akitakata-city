import type { GeneralQuestionTopic } from "../types";

export type SpeakerTurn = {
  speaker: string;
  displayName: string;
  paragraphs: string[];
  isQuestioner: boolean;
};

// 議事録PDFの話者行頭マーク（◯ / ○ / 〇 が混在する）
const SPEAKER_MARK_RE = /^[◯○〇]/;
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
 * - 前の行が折り返し幅まで埋まっていれば、その次の行は続きとみなして連結する
 * - 段落の先頭行は続き行より1〜2文字深くインデントされるため、
 *   インデントが増えた行は連結せず新しい段落として扱う
 * - 空行と話者マーク（◯）で始まる行は必ず段落の区切りになる
 */
export function unwrapTranscriptLines(rawText: string): string[] {
  const lines = rawText.split("\n");
  const wrapWidth = estimateWrapWidth(lines);

  const paragraphs: string[] = [];
  let prevFilled = false;
  let prevIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      prevFilled = false;
      prevIndent = -1;
      continue;
    }

    const indent = line.length - line.trimStart().length;
    const isSpeakerLine = SPEAKER_MARK_RE.test(trimmed);
    const isContinuation =
      wrapWidth !== null &&
      paragraphs.length > 0 &&
      prevFilled &&
      !isSpeakerLine &&
      !(prevIndent >= 0 && indent > prevIndent);

    if (isContinuation) {
      paragraphs[paragraphs.length - 1] += trimmed;
    } else {
      paragraphs.push(trimmed);
    }

    prevFilled =
      wrapWidth !== null && displayWidth(line) >= wrapWidth - WRAP_TOLERANCE;
    // 話者マーク行は話者名の分だけ字下げが崩れるためインデント判定から除外する
    prevIndent = isSpeakerLine ? -1 : indent;
  }

  return paragraphs;
}

// "新 田 議 員" → "新田議員"（CJK文字間のスペースを除去）
export function normalizeDisplayName(speaker: string): string {
  return speaker.replace(
    /(?<=[　-鿿（）〔〕【】])\s+(?=[　-鿿（）〔〕【】])/g,
    ""
  );
}

export function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  let current: SpeakerTurn | null = null;

  for (const paragraph of unwrapTranscriptLines(rawText)) {
    if (!SPEAKER_MARK_RE.test(paragraph)) {
      // 話者マークのない段落は直前の発言の続き（議長の指名などは捨てられる）
      if (current) current.paragraphs.push(paragraph);
      continue;
    }

    current = null;
    // 話者名と発言は 2文字以上の空白で区切られる。
    // 名前自体は "新 田 議 員" のようにCJK文字間に単一スペースを含む。
    const match = paragraph
      .replace(SPEAKER_MARK_RE, "")
      .match(/^(.+?)\s{2,}([\s\S]*)$/);
    if (!match) continue;

    const speaker = match[1].trim();
    const text = match[2].trim();
    if (!speaker || /議\s*長/.test(speaker)) continue;

    current = {
      speaker,
      displayName: normalizeDisplayName(speaker),
      paragraphs: text.length > 0 ? [text] : [],
      isQuestioner: /議\s*員/.test(speaker),
    };
    turns.push(current);
  }

  return turns;
}

// トピックの raw_question 先頭テキストでターン位置を特定する。
// AI生成の raw_question は議事録と微妙に異なる表現になる場合があるため、
// キー長を 15→12→9→6 と段階的に短縮して最初にマッチしたターンを採用する。
export function findTopicBoundaries(
  turns: SpeakerTurn[],
  topics: GeneralQuestionTopic[]
): Map<number, string> {
  const boundaries = new Map<number, string>();
  const turnTexts = turns.map((turn) =>
    turn.paragraphs.join("").replace(/\s/g, "")
  );
  let searchFrom = 0;

  for (const topic of topics) {
    if (!topic.raw_question) continue;
    const q = topic.raw_question.replace(/\s/g, "");

    for (const keyLen of [15, 12, 9, 6]) {
      if (q.length < keyLen) continue;
      const key = q.slice(0, keyLen);

      let found = false;
      for (let i = searchFrom; i < turns.length; i++) {
        if (turns[i].isQuestioner && turnTexts[i].includes(key)) {
          boundaries.set(i, topic.title);
          searchFrom = i + 1;
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }
  return boundaries;
}
