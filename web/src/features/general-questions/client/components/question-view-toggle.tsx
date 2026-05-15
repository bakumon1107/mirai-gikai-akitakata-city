"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import { QuestionChatView } from "./question-chat-view";
import type { GeneralQuestionTopic } from "../../shared/types";

function RawTranscriptContent({ topics }: { topics: GeneralQuestionTopic[] }) {
  return (
    <div className="flex flex-col gap-8">
      {topics.map((topic, i) => (
        <div key={`${topic.title}-${i}`} className="flex flex-col gap-3">
          <p className="text-center text-xs font-medium text-mirai-text-secondary bg-mirai-surface-muted rounded-full px-3 py-1 mx-auto">
            {topic.title}
          </p>
          {topic.raw_question && (
            <div className="flex items-end justify-end gap-2">
              <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {topic.raw_question}
                </p>
              </div>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
            </div>
          )}
          {topic.raw_answer && (
            <div className="flex items-end gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mirai-surface-muted border border-border">
                <MessageCircle className="h-4 w-4 text-mirai-text-secondary" />
              </div>
              <div className="max-w-[85%]">
                <p className="mb-1 text-xs text-mirai-text-secondary">
                  {topic.answerer_role}
                  {topic.answerer_name ? `　${topic.answerer_name}` : ""}
                </p>
                <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-mirai-text">
                    {topic.raw_answer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface QuestionViewToggleProps {
  topics: GeneralQuestionTopic[];
  rawText: string;
}

export function QuestionViewToggle({
  topics,
  rawText: _rawText,
}: QuestionViewToggleProps) {
  const [mode, setMode] = useState<"summary" | "raw">("summary");
  const hasRaw = topics.some((t) => t.raw_question || t.raw_answer);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === "summary" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("summary")}
        >
          要約
        </Button>
        {hasRaw && (
          <Button
            variant={mode === "raw" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("raw")}
          >
            詳しく（原文）
          </Button>
        )}
      </div>
      {mode === "summary" ? (
        <QuestionChatView topics={topics} />
      ) : (
        <RawTranscriptContent topics={topics} />
      )}
    </div>
  );
}
