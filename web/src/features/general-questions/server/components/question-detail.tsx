import type { GeneralQuestion, QuestionTopic } from "../../shared/types";

interface QuestionDetailProps {
  question: GeneralQuestion;
}

export function QuestionDetail({ question }: QuestionDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        {question.questioner_number != null && (
          <span className="inline-flex items-center justify-center px-3 py-0.5 text-xs font-medium text-mirai-text bg-mirai-surface-warm rounded-full border border-mirai-border-muted">
            {question.questioner_number}番
          </span>
        )}
        <h1 className="text-2xl font-bold">{question.questioner_name}</h1>
        <span className="text-sm text-muted-foreground">
          第{question.session_day}日目
        </span>
      </div>

      {/* トピック一覧 */}
      <div className="flex flex-col gap-6">
        {question.topics.map((topic) => (
          <TopicSection key={topic.index} topic={topic} />
        ))}
      </div>
    </div>
  );
}

function TopicSection({ topic }: { topic: QuestionTopic }) {
  return (
    <section className="border border-mirai-border-muted rounded-2xl overflow-hidden">
      {/* タイトル */}
      <div className="bg-mirai-surface-warm px-5 py-3">
        <p className="text-xs text-muted-foreground mb-0.5">
          大枠{topic.index}
        </p>
        <h2 className="font-bold text-base leading-snug">{topic.title}</h2>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* 質問概要 */}
        {topic.question_summary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              質問の概要
            </p>
            <p className="text-sm leading-relaxed">{topic.question_summary}</p>
          </div>
        )}

        {/* 答弁概要 */}
        {topic.answer_summary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              答弁の概要
            </p>
            <p className="text-sm leading-relaxed">{topic.answer_summary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
