"use client";

import type { Route } from "next";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import type { GeneralQuestion } from "../../shared/types";

interface QuestionCardProps {
  question: GeneralQuestion;
  sessionSlug: string;
}

export function QuestionCard({ question, sessionSlug }: QuestionCardProps) {
  const href = `/sessions/${sessionSlug}/questions/${question.id}` as Route;

  return (
    <Link href={href} className="block">
      <Card className="border border-black hover:bg-muted/50 transition-colors h-full">
        <CardHeader className="flex flex-col gap-3">
          {/* 議員バッジ */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-3 py-0.5 text-xs font-medium text-mirai-text bg-mirai-surface-warm rounded-full border border-mirai-border-muted">
              {question.questioner_number != null
                ? `${question.questioner_number}番`
                : ""}
            </span>
            <span className="text-sm font-bold">
              {question.questioner_name}
            </span>
          </div>

          {/* 質問テーマ一覧 */}
          {question.topics.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {question.topics.map((topic) => (
                <li key={topic.index} className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 rounded-full bg-primary-accent shrink-0" />
                  <span className="text-sm leading-snug line-clamp-2">
                    {topic.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">データ準備中</p>
          )}

          {/* フッター */}
          <p className="text-xs text-muted-foreground mt-auto">
            第{question.session_day}日目
          </p>
        </CardHeader>
      </Card>
    </Link>
  );
}
