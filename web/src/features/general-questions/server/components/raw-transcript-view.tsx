import "server-only";
import type { GeneralQuestionTopic } from "../../shared/types";

type SpeakerTurn = {
  speaker: string;
  displayName: string;
  text: string;
  isQuestioner: boolean;
};

// "新 田 議 員" → "新田議員"（CJK文字間のスペースを除去）
function normalizeDisplayName(speaker: string): string {
  return speaker.replace(
    /(?<=[　-鿿（）〔〕【】])\s+(?=[　-鿿（）〔〕【】])/g,
    ""
  );
}

function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  const segments = rawText.split("◯").filter((s) => s.trim().length > 0);

  for (const seg of segments) {
    // 話者名と発言は 2文字以上の空白で区切られる。
    // 名前自体は "新 田 議 員" のようにCJK文字間に単一スペースを含む。
    const match = seg.match(/^(.+?)\s{2,}([\s\S]*)$/);
    if (!match) continue;

    const speaker = match[1].trim();
    const text = match[2]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (!speaker || /議\s*長/.test(speaker)) continue;
    turns.push({
      speaker,
      displayName: normalizeDisplayName(speaker),
      text,
      isQuestioner: /議\s*員/.test(speaker),
    });
  }
  return turns;
}

// トピックの raw_question 先頭テキストでターン位置を特定する
function findTopicBoundaries(
  turns: SpeakerTurn[],
  topics: GeneralQuestionTopic[]
): Map<number, string> {
  const boundaries = new Map<number, string>();
  let searchFrom = 0;

  for (const topic of topics) {
    if (!topic.raw_question) continue;
    const key = topic.raw_question.replace(/\s/g, "").slice(0, 15);

    for (let i = searchFrom; i < turns.length; i++) {
      if (
        turns[i].isQuestioner &&
        turns[i].text.replace(/\s/g, "").includes(key)
      ) {
        boundaries.set(i, topic.title);
        searchFrom = i + 1;
        break;
      }
    }
  }
  return boundaries;
}

function TurnBubble({ turn }: { turn: SpeakerTurn }) {
  const isQ = turn.isQuestioner;
  return (
    <div className={isQ ? "flex justify-end" : "flex"}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isQ
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-mirai-text rounded-bl-sm"
        }`}
      >
        <p
          className={`mb-1 text-xs font-medium ${
            isQ ? "text-primary-foreground/70" : "text-mirai-text-secondary"
          }`}
        >
          {turn.displayName}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {turn.text}
        </p>
      </div>
    </div>
  );
}

export function RawTranscriptView({
  rawText,
  topics,
}: {
  rawText: string;
  topics?: GeneralQuestionTopic[];
}) {
  const turns = parseSpeakerTurns(rawText);
  const boundaries =
    topics && topics.length > 0
      ? findTopicBoundaries(turns, topics)
      : new Map<number, string>();

  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => (
        <div key={`${i}-${turn.speaker}`}>
          {boundaries.has(i) && (
            <p className="text-center text-xs font-medium text-mirai-text-secondary bg-mirai-surface-muted rounded-full px-3 py-1 mx-auto w-fit mb-4">
              {boundaries.get(i)}
            </p>
          )}
          <TurnBubble turn={turn} />
        </div>
      ))}
    </div>
  );
}
