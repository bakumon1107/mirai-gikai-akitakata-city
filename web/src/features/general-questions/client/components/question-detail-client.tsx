"use client";

import { useState } from "react";
import type {
  GeneralQuestion,
  QuestionExchange,
  QuestionTopic,
} from "../../shared/types";

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

// ─── チャット形式の発言 ──────────────────────────────────────

function ChatBubble({ exchange }: { exchange: QuestionExchange }) {
  const isQuestioner = exchange.speaker === "questioner";
  return (
    <div
      className={`flex gap-2 ${isQuestioner ? "flex-row" : "flex-row-reverse"}`}
    >
      {/* アバター */}
      <div
        className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          isQuestioner
            ? "bg-primary-accent text-white"
            : "bg-mirai-surface-warm border border-mirai-border-muted text-mirai-text"
        }`}
      >
        {isQuestioner ? "質" : "答"}
      </div>

      <div
        className={`flex flex-col gap-0.5 max-w-[80%] ${isQuestioner ? "items-start" : "items-end"}`}
      >
        {/* 名前・役職 */}
        <p className="text-xs text-muted-foreground">
          {exchange.name}
          {exchange.role && `（${exchange.role}）`}
        </p>
        {/* バブル */}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isQuestioner
              ? "bg-mirai-surface-warm rounded-tl-none"
              : "bg-primary-accent/10 rounded-tr-none"
          }`}
        >
          {exchange.text}
        </div>
      </div>
    </div>
  );
}

// ─── トピックセクション ─────────────────────────────────────

function TopicSection({
  topic,
  isDetail,
}: {
  topic: QuestionTopic;
  isDetail: boolean;
}) {
  return (
    <section className="border border-mirai-border-muted rounded-2xl overflow-hidden">
      {/* タイトル */}
      <div className="bg-mirai-surface-warm px-5 py-3">
        <p className="text-xs text-muted-foreground mb-0.5">
          大枠{topic.index}
        </p>
        <h2 className="font-bold text-base leading-snug">{topic.title}</h2>
      </div>

      <div className="p-5">
        {isDetail ? (
          /* 詳細: チャット形式 */
          <div className="flex flex-col gap-3">
            {topic.exchanges.length > 0 ? (
              topic.exchanges.map((ex, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: exchanges have no stable id
                <ChatBubble key={i} exchange={ex} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">詳細データ準備中</p>
            )}
          </div>
        ) : (
          /* 概要: サマリー表示 */
          <div className="flex flex-col gap-4">
            {topic.question_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  質問の概要
                </p>
                <p className="text-sm leading-relaxed">
                  {topic.question_summary}
                </p>
              </div>
            )}
            {topic.answer_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  答弁の概要
                </p>
                <p className="text-sm leading-relaxed">
                  {topic.answer_summary}
                </p>
              </div>
            )}
          </div>
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
  const [isDetail, setIsDetail] = useState(false);

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

      {/* 概要 / 詳細 スイッチ */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">表示:</span>
        <div className="flex rounded-lg border border-mirai-border-muted overflow-hidden text-sm font-medium">
          <button
            type="button"
            onClick={() => setIsDetail(false)}
            className={`px-4 py-1.5 transition-colors ${
              !isDetail
                ? "bg-primary-accent text-white"
                : "bg-white text-muted-foreground hover:bg-muted/50"
            }`}
          >
            概要
          </button>
          <button
            type="button"
            onClick={() => setIsDetail(true)}
            className={`px-4 py-1.5 transition-colors ${
              isDetail
                ? "bg-primary-accent text-white"
                : "bg-white text-muted-foreground hover:bg-muted/50"
            }`}
          >
            詳細
          </button>
        </div>
      </div>

      {/* トピック一覧 */}
      <div className="flex flex-col gap-4">
        {question.topics.map((topic) => (
          <TopicSection key={topic.index} topic={topic} isDetail={isDetail} />
        ))}
      </div>

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
