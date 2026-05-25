"use client";

import { useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { QuestionChatView } from "./question-chat-view";
import type { GeneralQuestionTopic } from "../../shared/types";

interface QuestionViewToggleProps {
  topics: GeneralQuestionTopic[];
  rawTranscriptSlot?: React.ReactNode;
}

export function QuestionViewToggle({
  topics,
  rawTranscriptSlot,
}: QuestionViewToggleProps) {
  const [mode, setMode] = useState<"summary" | "raw">("summary");

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
        {rawTranscriptSlot && (
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
        rawTranscriptSlot
      )}
    </div>
  );
}
