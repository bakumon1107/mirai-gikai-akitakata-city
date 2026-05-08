"use client";

import { MessageCircle, User } from "lucide-react";
import type { GeneralQuestionTopic } from "../../shared/types";

function ChatBubbleQuestion({ text }: { text: string }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[75%] bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3">
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4 w-4" />
      </div>
    </div>
  );
}

function ChatBubbleAnswer({
  text,
  role,
  name,
}: {
  text: string;
  role: string;
  name: string;
}) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mirai-surface-muted border border-border">
        <MessageCircle className="h-4 w-4 text-mirai-text-secondary" />
      </div>
      <div className="max-w-[75%]">
        <p className="mb-1 text-xs text-mirai-text-secondary">
          {role}
          {name ? `　${name}` : ""}
        </p>
        <div className="rounded-2xl rounded-bl-sm bg-card border border-border px-4 py-3">
          <p className="text-sm leading-relaxed text-mirai-text">{text}</p>
        </div>
      </div>
    </div>
  );
}

interface QuestionChatViewProps {
  topics: GeneralQuestionTopic[];
}

export function QuestionChatView({ topics }: QuestionChatViewProps) {
  return (
    <div className="flex flex-col gap-8">
      {topics.map((topic, i) => (
        <div key={`${topic.title}-${i}`} className="flex flex-col gap-3">
          <p className="text-center text-xs font-medium text-mirai-text-secondary bg-mirai-surface-muted rounded-full px-3 py-1 mx-auto">
            {topic.title}
          </p>
          <ChatBubbleQuestion text={topic.question_summary} />
          <ChatBubbleAnswer
            text={topic.answer_summary}
            role={topic.answerer_role}
            name={topic.answerer_name}
          />
        </div>
      ))}
    </div>
  );
}
