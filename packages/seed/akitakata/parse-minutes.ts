/**
 * parse-minutes.ts
 *
 * 安芸高田市議会の会議録テキストをパースして発言ブロックに分割する純粋関数群。
 * pdftotext で抽出した議事録を対象とする。
 *
 * 話者行フォーマット:
 *   ○[名前（スペース区切り）] [複数スペース] [発言内容1行目]
 *   例:
 *     ○石 飛 議 長             定刻になりました。
 *     ○南 澤 議 員    議案番号第7号についてお伺いします。
 *     ○藤 本 市 長    おはようございます。
 *     ○高下企画部長   ただいまの件ですけども...
 *   続く発言行は先頭が半角スペースで始まる。
 */

/** 発言者の種別 */
export type SpeakerType = "questioner" | "answerer" | "chairperson";

/** 1つの発言ブロック */
export type SpeechBlock = {
  speakerType: SpeakerType;
  speakerName: string;
  speakerNumber?: string; // 議席番号（質問者のみ、取得できた場合）
  speakerRole?: string; // 役職（答弁者のみ）
  text: string;
};

/** 質疑セット（1質問者分の全発言）*/
export type DiscussionGroup = {
  questionerName: string;
  questionerNumber: string;
  billNumbers: string[]; // 質問対象の議案番号（例: ["9", "12"]）
  speeches: SpeechBlock[];
};

// ─── 正規表現 ───────────────────────────────────────────────

// ○ で始まる話者行: ○[名前部分]  [複数スペース][内容...]
// 名前部分は2つ以上の連続スペースで終わる
const SPEAKER_LINE_RE = /^○(.+?)(?:\s{2,}|$)/;

// 役職判定
const CHAIRPERSON_SUFFIX_RE =
  /議\s*長$|委\s*員\s*長$|事\s*務\s*局\s*長$/;
const COUNCILOR_SUFFIX_RE = /議\s*員$/;
const MAYOR_SUFFIX_RE = /市\s*長$/; // 副市長・市長どちらも含む
const OFFICIAL_ROLE_RE = /部長$|局長$|管理監$|教育長$/;

// 議席番号: 「7番、」「1番、」など発言冒頭
const SEAT_NUMBER_RE = /^(\d+)番[、,]/;

// 議案番号: 「議案番号第7号」「議案第9号」「議案の第12号」など
const BILL_NUMBER_RE = /議案(?:番号|の)?第(\d+)号/g;

// ─── ヘルパー ────────────────────────────────────────────

/**
 * 話者識別文字列を解析して SpeakerType, name, role を返す。
 * 例: "石 飛 議 長" → { type: "chairperson", name: "石飛", role: "議長" }
 *     "高下企画部長"  → { type: "answerer", name: "高下", role: "企画部長" }
 *     "南 澤 議 員"  → { type: "questioner", name: "南澤", role: undefined }
 */
export function parseSpeaker(raw: string): {
  type: SpeakerType;
  name: string;
  role?: string;
} {
  const normalized = raw.trim();

  // ─ 議長・委員長・事務局長 → chairperson
  if (CHAIRPERSON_SUFFIX_RE.test(normalized)) {
    const name = normalized.replace(/\s/g, "").replace(/議長$|委員長$|事務局長$/, "");
    return { type: "chairperson", name };
  }

  // ─ 議員 → questioner
  if (COUNCILOR_SUFFIX_RE.test(normalized)) {
    const name = normalized.replace(/\s/g, "").replace(/議員$/, "");
    return { type: "questioner", name };
  }

  // ─ 市長・副市長 → answerer
  if (MAYOR_SUFFIX_RE.test(normalized)) {
    const withoutSpaces = normalized.replace(/\s/g, "");
    if (/副市長$/.test(withoutSpaces)) {
      const name = withoutSpaces.replace(/副市長$/, "");
      return { type: "answerer", name, role: "副市長" };
    }
    const name = withoutSpaces.replace(/市長$/, "");
    return { type: "answerer", name, role: "市長" };
  }

  // ─ 部長・局長・管理監・教育長（スペースなし形式）→ answerer
  if (OFFICIAL_ROLE_RE.test(normalized)) {
    // 先頭2文字が氏名、残りが役職（例: "高下企画部長" → name="高下", role="企画部長"）
    const match = normalized.match(/^(.{2})(.+)$/);
    if (match) {
      return { type: "answerer", name: match[1], role: match[2] };
    }
    return { type: "answerer", name: normalized };
  }

  // ─ 判定できない場合は chairperson 扱い（スキップ対象）
  return { type: "chairperson", name: normalized.replace(/\s/g, "") };
}

/** テキストから議案番号を抽出する */
export function extractBillNumbers(text: string): string[] {
  const matches = [...text.matchAll(BILL_NUMBER_RE)];
  const numbers = matches.map((m) => m[1]);
  return [...new Set(numbers)];
}

/** 往復回数をカウントする（質問→答弁で1往復） */
export function countExchanges(speeches: SpeechBlock[]): number {
  let count = 0;
  let lastWasQuestion = false;
  for (const s of speeches) {
    if (s.speakerType === "questioner") {
      lastWasQuestion = true;
    } else if (s.speakerType === "answerer" && lastWasQuestion) {
      count++;
      lastWasQuestion = false;
    }
  }
  return Math.max(count, 1);
}

// ─── パーサー ─────────────────────────────────────────────

/**
 * 会議録テキストを発言ブロック一覧にパースする
 */
export function parseMinutes(text: string): SpeechBlock[] {
  const lines = text.split("\n");
  const blocks: SpeechBlock[] = [];

  let currentBlock: SpeechBlock | null = null;
  let currentLines: string[] = [];

  function flushBlock() {
    if (currentBlock) {
      currentBlock.text = currentLines.join("\n").trim();
      if (currentBlock.text.length > 0) {
        blocks.push(currentBlock);
      }
    }
    currentBlock = null;
    currentLines = [];
  }

  for (const line of lines) {
    // 話者行: ○ で始まる
    if (line.startsWith("○")) {
      flushBlock();

      const speakerMatch = line.match(SPEAKER_LINE_RE);
      if (!speakerMatch) continue;

      const speakerRaw = speakerMatch[1];
      // 話者識別部分を除いた残りテキスト（同じ行の発言内容）
      const rest = line.slice(speakerMatch[0].length).trim();

      const parsed = parseSpeaker(speakerRaw);

      // 議席番号を冒頭テキストから抽出（質問者のみ）
      let seatNumber: string | undefined;
      if (parsed.type === "questioner") {
        const seatMatch = rest.match(SEAT_NUMBER_RE);
        if (seatMatch) {
          seatNumber = seatMatch[1];
        }
      }

      currentBlock = {
        speakerType: parsed.type,
        speakerName: parsed.name,
        speakerNumber: seatNumber,
        speakerRole: parsed.role,
        text: "",
      };
      currentLines = rest ? [rest] : [];
      continue;
    }

    // セクション区切り行: スキップ（ブロックも終了）
    if (line.includes("～～～～～～～～◯～～～～～～～～")) {
      flushBlock();
      continue;
    }

    // 発言の続き（インデントあり or 空行）
    if (currentBlock) {
      currentLines.push(line.trim());
    }
  }

  flushBlock();
  return blocks;
}

/**
 * 発言ブロック一覧を質疑セットにグループ化する
 */
export function groupIntoDiscussions(
  speeches: SpeechBlock[]
): DiscussionGroup[] {
  const groups: DiscussionGroup[] = [];
  let currentGroup: DiscussionGroup | null = null;
  let currentSpeeches: SpeechBlock[] = [];
  let currentQuestionerName: string | null = null;

  function flushGroup() {
    if (currentGroup && currentSpeeches.length > 0) {
      const questionSpeeches = currentSpeeches.filter(
        (s) => s.speakerType === "questioner"
      );
      const questionText = questionSpeeches.map((s) => s.text).join("\n");
      const billNumbers = extractBillNumbers(questionText);

      currentGroup.billNumbers = billNumbers;
      currentGroup.speeches = currentSpeeches;
      groups.push(currentGroup);
    }
    currentGroup = null;
    currentSpeeches = [];
  }

  for (const speech of speeches) {
    if (speech.speakerType === "chairperson") {
      continue;
    }

    if (speech.speakerType === "questioner") {
      if (speech.speakerName !== currentQuestionerName) {
        // 新しい質問者 → グループを切り替える
        flushGroup();
        currentQuestionerName = speech.speakerName;
        currentGroup = {
          questionerName: speech.speakerName,
          questionerNumber: speech.speakerNumber ?? "",
          billNumbers: [],
          speeches: [],
        };
      }
    }

    if (currentGroup) {
      currentSpeeches.push(speech);
    }
  }

  flushGroup();
  return groups;
}
