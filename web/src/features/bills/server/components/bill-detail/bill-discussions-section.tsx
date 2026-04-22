import { MessageSquare } from "lucide-react";
import type { BillDiscussion } from "../../loaders/get-bill-discussions";

interface BillDiscussionsSectionProps {
  discussions: BillDiscussion[];
}

export function BillDiscussionsSection({
  discussions,
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
      <div className="space-y-6">
        {discussions.map((discussion) => (
          <DiscussionCard key={discussion.id} discussion={discussion} />
        ))}
      </div>
    </section>
  );
}

function DiscussionCard({ discussion }: { discussion: BillDiscussion }) {
  const questionerLabel = [
    discussion.questioner_name,
    discussion.questioner_number ? `${discussion.questioner_number}番` : null,
    discussion.questioner_party,
  ]
    .filter(Boolean)
    .join("・");

  return (
    <div className="border border-mirai-border rounded-lg overflow-hidden">
      {/* 質問者 */}
      <div className="bg-mirai-surface px-4 py-3">
        <p className="text-sm font-semibold text-mirai-text">
          {questionerLabel}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 質問のポイント */}
        {discussion.question_summary && (
          <div>
            <p className="text-xs font-semibold text-mirai-text-muted uppercase tracking-wide mb-1">
              質問のポイント
            </p>
            <p className="text-sm text-mirai-text leading-relaxed">
              {discussion.question_summary}
            </p>
          </div>
        )}

        {/* 答弁 */}
        {discussion.answer_summary && (
          <div className="border-t border-mirai-border pt-4">
            {(discussion.answerer_role || discussion.answerer_name) && (
              <p className="text-xs font-semibold text-mirai-text-muted uppercase tracking-wide mb-1">
                {[discussion.answerer_role, discussion.answerer_name]
                  .filter(Boolean)
                  .join("・")}{" "}
                の答弁
              </p>
            )}
            <p className="text-sm text-mirai-text leading-relaxed">
              {discussion.answer_summary}
            </p>
          </div>
        )}

        {/* 往復回数 */}
        <div className="text-right">
          <span className="text-xs text-mirai-text-muted">
            往復{" "}
            <span className="font-semibold">{discussion.exchange_count}</span>{" "}
            回
          </span>
        </div>
      </div>
    </div>
  );
}
