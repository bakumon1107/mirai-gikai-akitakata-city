import "server-only";
import { Gavel, MessageCircle, User } from "lucide-react";
import type { GeneralQuestionTopic } from "../../shared/types";
import {
  findTopicBoundaries,
  parseSpeakerTurns,
  type SpeakerTurn,
} from "../../shared/utils/parse-transcript";

function TurnParagraphs({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {paragraphs.map((paragraph, i) => (
        <p
          key={`${i}-${paragraph.slice(0, 12)}`}
          className="text-sm leading-relaxed"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

// 議長の発言は質疑応答ではなく議事進行なので、中央寄せの注釈として表示する
function ChairRemark({ turn }: { turn: SpeakerTurn }) {
  return (
    <div className="mx-auto max-w-[90%] rounded-xl border border-border border-dashed bg-mirai-surface-muted px-4 py-3 text-center">
      <p className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-mirai-text-secondary">
        <Gavel className="h-3 w-3" />
        {turn.displayName}
      </p>
      <div className="text-mirai-text-secondary">
        <TurnParagraphs paragraphs={turn.paragraphs} />
      </div>
    </div>
  );
}

function TurnBubble({ turn }: { turn: SpeakerTurn }) {
  if (turn.isChair) {
    return <ChairRemark turn={turn} />;
  }

  if (turn.isQuestioner) {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
          <TurnParagraphs paragraphs={turn.paragraphs} />
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mirai-surface-muted border border-border">
        <MessageCircle className="h-4 w-4 text-mirai-text-secondary" />
      </div>
      <div className="max-w-[85%]">
        <p className="mb-1 text-xs text-mirai-text-secondary">
          {turn.displayName}
        </p>
        <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3 text-mirai-text">
          <TurnParagraphs paragraphs={turn.paragraphs} />
        </div>
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
