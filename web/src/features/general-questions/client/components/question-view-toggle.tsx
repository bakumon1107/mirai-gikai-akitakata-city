"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionChatView } from "./question-chat-view";
import type { GeneralQuestionTopic } from "../../shared/types";

type SpeakerTurn = { speaker: string; text: string };

function parseSpeakerTurns(rawText: string): SpeakerTurn[] {
  const turns: SpeakerTurn[] = [];
  const segments = rawText.split("◯").filter((s) => s.trim().length > 0);
  for (const seg of segments) {
    const newlineIdx = seg.search(/[\s　]/);
    if (newlineIdx === -1) {
      turns.push({ speaker: seg.trim(), text: "" });
      continue;
    }
    const speaker = seg.slice(0, newlineIdx).trim();
    const text = seg.slice(newlineIdx).trim();
    if (speaker.includes("議長")) continue;
    turns.push({ speaker, text });
  }
  return turns;
}

function isQuestioner(speaker: string): boolean {
  return /^\d+番/.test(speaker);
}

function RawTranscriptContent({
  rawText,
  topics,
}: {
  rawText: string;
  topics: GeneralQuestionTopic[];
}) {
  const turns = parseSpeakerTurns(rawText);
  const dividerAt = new Map<number, string>();
  if (topics.length > 0) {
    dividerAt.set(0, topics[0].title);
    for (let i = 1; i < topics.length; i++) {
      dividerAt.set(
        Math.floor((turns.length * i) / topics.length),
        topics[i].title
      );
    }
  }
  return (
    <div className="flex flex-col gap-4">
      {turns.map((turn, i) => {
        const topicTitle = dividerAt.get(i);
        const isQ = isQuestioner(turn.speaker);
        return (
          <Fragment key={`${i}-${turn.speaker}`}>
            {topicTitle && (
              <p className="text-center text-xs font-medium text-mirai-text-secondary bg-mirai-surface-muted rounded-full px-3 py-1 mx-auto">
                {topicTitle}
              </p>
            )}
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
                    isQ
                      ? "text-primary-foreground/70"
                      : "text-mirai-text-secondary"
                  }`}
                >
                  {turn.speaker}
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {turn.text}
                </p>
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

interface QuestionViewToggleProps {
  topics: GeneralQuestionTopic[];
  rawText: string;
}

export function QuestionViewToggle({
  topics,
  rawText,
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
        <Button
          variant={mode === "raw" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("raw")}
        >
          詳しく（原文）
        </Button>
      </div>
      {mode === "summary" ? (
        <QuestionChatView topics={topics} />
      ) : (
        <RawTranscriptContent rawText={rawText} topics={topics} />
      )}
    </div>
  );
}
