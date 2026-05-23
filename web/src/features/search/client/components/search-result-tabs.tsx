"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Mic,
  ChevronDown,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type {
  SearchResults,
  SearchTab,
  BillSearchResult,
  QuestionSearchResult,
  PressConferenceSearchResult,
} from "../../shared/types/search-types";

const TAB_LABELS: Record<SearchTab, string> = {
  all: "すべて",
  bills: "議案",
  questions: "一般質問",
  press: "記者会見",
};

const SECTION_LIMIT = 3;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function BillCard({ bill }: { bill: BillSearchResult }) {
  return (
    <Link
      href={routes.billDetail(bill.id)}
      className="block border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <FileText className="size-4 text-mirai-text-muted shrink-0" />
        <span className="text-xs text-mirai-text-muted">
          議案 · {bill.session}
        </span>
      </div>
      <p className="font-medium text-mirai-text text-sm leading-snug mb-2">
        {bill.title}
      </p>
      <p className="text-xs text-mirai-text-secondary line-clamp-2 mb-3">
        {bill.summary}
      </p>
      {bill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bill.tags.map((tag) => (
            <Badge key={tag} variant="muted" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

function QuestionCard({ question }: { question: QuestionSearchResult }) {
  return (
    <Link
      href={routes.questionDetail(question.id)}
      className="block border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="size-4 text-mirai-text-muted shrink-0" />
        <span className="text-xs text-mirai-text-muted">
          一般質問 · {question.questioner} · {question.session}
        </span>
      </div>
      {question.topics.length > 0 && (
        <p className="font-medium text-mirai-text text-sm leading-snug mb-2">
          {question.topics[0]}
          {question.topics.length > 1 && (
            <span className="text-mirai-text-muted font-normal">
              {" "}
              他{question.topics.length - 1}件
            </span>
          )}
        </p>
      )}
      {question.summary && (
        <p className="text-xs text-mirai-text-secondary line-clamp-2">
          {question.summary}
        </p>
      )}
    </Link>
  );
}

function PressConferenceCard({ pc }: { pc: PressConferenceSearchResult }) {
  return (
    <Link
      href={routes.pressConferenceDetail(pc.slug)}
      className="block border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Mic className="size-4 text-mirai-text-muted shrink-0" />
        <span className="text-xs text-mirai-text-muted">
          記者会見 · {formatDate(pc.heldAt)}
        </span>
      </div>
      <p className="font-medium text-mirai-text text-sm leading-snug">
        {pc.title}
      </p>
    </Link>
  );
}

function ResultSection<T>({
  title,
  items,
  renderCard,
}: {
  title: string;
  items: T[];
  renderCard: (item: T, i: number) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, SECTION_LIMIT);
  const remaining = items.length - SECTION_LIMIT;

  return (
    <section>
      <h2 className="text-sm font-semibold text-mirai-text-secondary mb-3">
        {title}
        <span className="ml-2 text-mirai-text-muted font-normal">
          {items.length}件
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {visible.map((item, i) => renderCard(item, i))}
      </div>
      {remaining > 0 && !expanded && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-mirai-text-muted border border-mirai-border"
          onClick={() => setExpanded(true)}
        >
          <ChevronDown className="size-4 mr-1" />
          残り{remaining}件を表示
        </Button>
      )}
    </section>
  );
}

type Props = {
  query: string;
  results: SearchResults | null;
};

export function SearchResultTabs({ query, results }: Props) {
  const [tab, setTab] = useState<SearchTab>("all");

  if (!query || !results) {
    return (
      <div className="text-center py-16 text-mirai-text-muted">
        <Search className="size-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">キーワードを入力すると検索結果が表示されます</p>
      </div>
    );
  }

  const { bills, questions, pressConferences } = results;
  const totalCount = bills.length + questions.length + pressConferences.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-16 text-mirai-text-muted">
        <p className="text-sm font-medium text-mirai-text mb-1">
          「{query}」に一致する結果はありませんでした
        </p>
        <p className="text-xs">別のキーワードで試してみてください</p>
      </div>
    );
  }

  const tabs: { key: SearchTab; count: number }[] = [
    { key: "all", count: totalCount },
    { key: "bills", count: bills.length },
    { key: "questions", count: questions.length },
    { key: "press", count: pressConferences.length },
  ];

  return (
    <div>
      <p className="text-xs text-mirai-text-muted mb-4">
        「{query}」の検索結果 全{totalCount}件
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, count }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => setTab(key)}
            className={[
              "rounded-full px-4 border transition-colors",
              tab === key
                ? "bg-mirai-text text-white border-mirai-text hover:bg-mirai-text hover:text-white"
                : "bg-white text-mirai-text-secondary border-mirai-border hover:bg-mirai-surface",
            ].join(" ")}
          >
            {TAB_LABELS[key]}
            <span
              className={[
                "ml-1 text-xs",
                tab === key ? "text-white/70" : "text-mirai-text-muted",
              ].join(" ")}
            >
              {count}
            </span>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {(tab === "all" || tab === "bills") && bills.length > 0 && (
          <ResultSection
            title="議案"
            items={bills}
            renderCard={(bill, i) => <BillCard key={i} bill={bill} />}
          />
        )}
        {(tab === "all" || tab === "questions") && questions.length > 0 && (
          <ResultSection
            title="一般質問"
            items={questions}
            renderCard={(q, i) => <QuestionCard key={i} question={q} />}
          />
        )}
        {(tab === "all" || tab === "press") && pressConferences.length > 0 && (
          <ResultSection
            title="記者会見"
            items={pressConferences}
            renderCard={(pc, i) => <PressConferenceCard key={i} pc={pc} />}
          />
        )}
      </div>
    </div>
  );
}
