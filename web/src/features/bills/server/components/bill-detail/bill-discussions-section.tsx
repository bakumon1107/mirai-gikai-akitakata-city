import { MessageSquare } from "lucide-react";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import type { BillDiscussion } from "../../loaders/get-bill-discussions";

interface BillDiscussionsSectionProps {
  discussions: BillDiscussion[];
  difficulty?: DifficultyLevelEnum;
}

export function BillDiscussionsSection({
  discussions,
  difficulty = "normal",
}: BillDiscussionsSectionProps) {
  if (discussions.length === 0) {
    return null;
  }

  return (
    <section className="bg-card rounded-xl p-6">
      <h2 className="text-lg font-bold text-mirai-text mb-5 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        議会での審議
      </h2>
      <div className="space-y-8">
        {discussions.map((discussion) => (
          <DiscussionThread
            key={discussion.id}
            discussion={discussion}
            difficulty={difficulty}
          />
        ))}
      </div>
    </section>
  );
}

// （追加）区切りでテキストを複数ターンに分割する
function splitTurns(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/（追加）/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function DiscussionThread({
  discussion,
  difficulty,
}: {
  discussion: BillDiscussion;
  difficulty: DifficultyLevelEnum;
}) {
  const questionerLabel = [
    discussion.questioner_name,
    discussion.questioner_number ? `${discussion.questioner_number}番` : null,
    discussion.questioner_party,
  ]
    .filter(Boolean)
    .join("・");

  const answererLabel = [discussion.answerer_role, discussion.answerer_name]
    .filter(Boolean)
    .join("・");

  const isRaw = difficulty === "hard";

  // 原文モード: （追加）で分割して交互に表示
  if (isRaw) {
    const qTurns = splitTurns(discussion.question_raw);
    const aTurns = splitTurns(discussion.answer_raw);
    const maxTurns = Math.max(qTurns.length, aTurns.length);

    return (
      <div className="space-y-3">
        {Array.from({ length: maxTurns }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 発言順は固定
          <div key={i} className="space-y-2">
            {qTurns[i] && (
              <ChatBubble
                side="question"
                speaker={questionerLabel}
                text={qTurns[i]}
              />
            )}
            {aTurns[i] && (
              <ChatBubble
                side="answer"
                speaker={answererLabel}
                text={aTurns[i]}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // サマリーモード: 要約を1Q・1Aで表示
  return (
    <div className="space-y-2">
      {discussion.question_summary && (
        <ChatBubble
          side="question"
          speaker={questionerLabel}
          text={discussion.question_summary}
        />
      )}
      {discussion.answer_summary && (
        <ChatBubble
          side="answer"
          speaker={answererLabel}
          text={discussion.answer_summary}
        />
      )}
      {discussion.exchange_count > 1 && (
        <p className="text-xs text-mirai-text-muted text-right mt-1">
          計 <span className="font-semibold">{discussion.exchange_count}</span>{" "}
          往復
        </p>
      )}
    </div>
  );
}

function ChatBubble({
  side,
  speaker,
  text,
}: {
  side: "question" | "answer";
  speaker: string;
  text: string;
}) {
  if (side === "question") {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-[11px] font-medium text-mirai-text-muted pl-1">
          {speaker}
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-mirai-surface px-4 py-2.5">
          <p className="text-sm text-mirai-text leading-relaxed">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[11px] font-medium text-mirai-text-muted pr-1">
        {speaker}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/10 px-4 py-2.5">
        <p className="text-sm text-mirai-text leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
