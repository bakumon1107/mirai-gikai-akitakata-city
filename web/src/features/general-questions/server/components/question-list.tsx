import { QuestionCard } from "../../../general-questions/client/components/question-card";
import type { GeneralQuestion } from "../../shared/types";

interface QuestionListProps {
  questions: GeneralQuestion[];
  sessionSlug: string;
}

export function QuestionList({ questions, sessionSlug }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        一般質問のデータがありません
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} sessionSlug={sessionSlug} />
      ))}
    </div>
  );
}
