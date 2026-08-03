import {
  SPEAKER_MARK_RE,
  unwrapTranscriptLines,
} from "@mirai-gikai/shared/transcript/unwrap";
import type { GeneralQuestionTopic } from "../types";
import { isSubstantiveChairRemark } from "./chair-remarks";

export type SpeakerTurn = {
  speaker: string;
  displayName: string;
  paragraphs: string[];
  isQuestioner: boolean;
  isChair: boolean;
};

// 議長が次の発言者を指名する行（"小松議員。" "8番、新田議員。" など）。
// 話者マークが付かないため、そのままでは直前の発言に混ざってしまう。
const NOMINATION_RE =
  /^(?:[0-9０-９]{1,2}\s*番[、，]?\s*)?[^\s。、]{1,10}(?:議員|市長|議長|部長|次長|課長|教育長|局長|委員長|参事|職務代理者)。$/;

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
      // 話者マークのない段落は直前の発言の続き。ただし議長の指名行は発言ではない
      if (current && !NOMINATION_RE.test(paragraph)) {
        current.paragraphs.push(paragraph);
      }
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
    if (!speaker) continue;

    current = {
      speaker,
      displayName: normalizeDisplayName(speaker),
      paragraphs: text.length > 0 ? [text] : [],
      isQuestioner: /議\s*員/.test(speaker),
      isChair: /議\s*長/.test(speaker),
    };
    turns.push(current);
  }

  // 議長の発言は議事進行の定型句だけのものを落とし、実質的な発言だけ残す
  return turns.filter(
    (turn) =>
      !turn.isChair || isSubstantiveChairRemark(turn.paragraphs.join(""))
  );
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
