"use client";

import type {
  GeneralQuestion,
  QuestionExchange,
  QuestionTopic,
  RadarScores,
} from "../../shared/types";
import { QuestionRadarChart } from "./question-radar-chart";

// ─── スタンスバッジ ───────────────────────────────────────────

const STANCE_CONFIG: Record<string, { label: string; className: string }> = {
  建設的提案型: {
    label: "建設的提案型",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  批判追及型: {
    label: "批判追及型",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  情報確認型: {
    label: "情報確認型",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  課題提起型: {
    label: "課題提起型",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

function StanceBadge({ stance }: { stance: string }) {
  const config = STANCE_CONFIG[stance] ?? {
    label: stance,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ─── チャット形式の発言（LINE風） ────────────────────────────
// 質問者（議員）= 右側・緑バブル
// 答弁者（市長等）= 左側・白バブル

function ChatBubble({ exchange }: { exchange: QuestionExchange }) {
  const isQuestioner = exchange.speaker === "questioner";

  return (
    <div
      className={`flex items-end gap-2 ${isQuestioner ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isQuestioner
            ? "bg-primary-accent text-white"
            : "bg-mirai-surface-warm border border-mirai-border-muted text-mirai-text"
        }`}
      >
        {isQuestioner ? "質" : "答"}
      </div>

      <div
        className={`flex flex-col gap-1 max-w-[72%] ${isQuestioner ? "items-end" : "items-start"}`}
      >
        <p className="text-xs text-muted-foreground px-1">
          {exchange.name}
          {exchange.role && `（${exchange.role}）`}
        </p>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isQuestioner
              ? "bg-primary-accent text-white rounded-2xl rounded-br-sm"
              : "bg-white border border-mirai-border-muted text-mirai-text rounded-2xl rounded-bl-sm"
          }`}
        >
          {exchange.text}
        </div>
      </div>
    </div>
  );
}

// ─── トピックセクション ─────────────────────────────────────

function TopicSection({ topic }: { topic: QuestionTopic }) {
  return (
    <section className="border border-mirai-border-muted rounded-2xl overflow-hidden">
      <div className="bg-mirai-surface-warm px-5 py-3">
        <h2 className="font-bold text-base leading-snug">{topic.title}</h2>
      </div>

      <div className="p-4">
        {topic.exchanges.length > 0 ? (
          <div className="flex flex-col gap-4 bg-mirai-surface-warm/40 rounded-xl p-3">
            {topic.exchanges.map((ex, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: exchanges have no stable id
              <ChatBubble key={i} exchange={ex} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            詳細データ準備中
          </p>
        )}
      </div>
    </section>
  );
}

// ─── メインコンポーネント ────────────────────────────────────

interface QuestionDetailClientProps {
  question: GeneralQuestion;
}

export function QuestionDetailClient({ question }: QuestionDetailClientProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 flex-wrap">
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

      {/* 総括 */}
      {question.overall_summary && (
        <div className="bg-mirai-surface-warm rounded-2xl px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            質問の総括
          </p>
          <p className="text-sm leading-relaxed">{question.overall_summary}</p>
        </div>
      )}

      {/* トピック一覧（チャット形式のみ） */}
      <div className="flex flex-col gap-4">
        {question.topics.map((topic) => (
          <TopicSection key={topic.index} topic={topic} />
        ))}
      </div>

      {/* レーダーチャート（質問の質評価） */}
      {question.radar_scores && (
        <QuestionRadarChart scores={question.radar_scores as RadarScores} />
      )}

      {/* スタンス分析 */}
      {(question.questioner_stance || question.stance_analysis) && (
        <div className="border border-mirai-border-muted rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            質問者のスタンス分析
          </p>
          {question.questioner_stance && (
            <StanceBadge stance={question.questioner_stance} />
          )}
          {question.stance_analysis && (
            <p className="text-sm leading-relaxed">
              {question.stance_analysis}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
