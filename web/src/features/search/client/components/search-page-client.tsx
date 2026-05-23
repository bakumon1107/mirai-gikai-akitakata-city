"use client";

import {
  ArrowRight,
  CalendarDays,
  FileText,
  Megaphone,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type {
  BillSearchResult,
  PressConferenceSearchResult,
  QuestionSearchResult,
  SearchResults,
} from "../../shared/types";

type Tab = "all" | "bills" | "questions" | "press";

const INITIAL_COUNT = 3;
const TAB_INITIAL_COUNT = 5;

type Props = {
  initialQuery: string;
  results: SearchResults | null;
};

export function SearchPageClient({ initialQuery, results }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
    setActiveTab("all");
    setExpanded({});
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      const clamped = value.slice(0, 100);
      setQuery(clamped);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.push(routes.search(clamped.trim() || undefined));
      }, 300);
    },
    [router]
  );

  const clearQuery = useCallback(() => {
    setQuery("");
    router.push(routes.search());
  }, [router]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const totalCount = results
    ? results.bills.length +
      results.questions.length +
      results.pressConferences.length
    : 0;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Search input */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-mirai-text">キーワード検索</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mirai-text-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="議案名・質問内容などで検索..."
            className="w-full pl-9 pr-9 py-3 rounded-xl border border-mirai-border bg-white text-sm text-mirai-text placeholder:text-mirai-text-placeholder focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            maxLength={100}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearQuery}
              aria-label="クリア"
              className="absolute right-1 top-1/2 -translate-y-1/2 size-7 text-mirai-text-muted hover:text-mirai-text hover:bg-mirai-surface"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {query.length === 1 && (
          <p className="text-xs text-mirai-text-muted">
            2文字以上入力してください
          </p>
        )}
      </div>

      {/* Pre-search state */}
      {!results && query.length < 2 && (
        <div className="flex flex-col items-center gap-3 py-16 text-mirai-text-muted">
          <Search className="w-10 h-10 opacity-30" />
          <p className="text-sm">議案・一般質問・記者会見を横断検索できます</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-mirai-border">
            {(
              [
                { key: "all", label: `全て (${totalCount})` },
                { key: "bills", label: `議案 (${results.bills.length})` },
                {
                  key: "questions",
                  label: `一般質問 (${results.questions.length})`,
                },
                {
                  key: "press",
                  label: `記者会見 (${results.pressConferences.length})`,
                },
              ] as { key: Tab; label: string }[]
            ).map(({ key, label }) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setActiveTab(key)}
                className={`rounded-none px-3 py-2 h-auto text-sm font-medium whitespace-nowrap border-b-2 -mb-px hover:bg-transparent transition-colors ${
                  activeTab === key
                    ? "border-primary-accent text-primary-accent"
                    : "border-transparent text-mirai-text-muted hover:text-mirai-text"
                }`}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* No results */}
          {totalCount === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-mirai-text-muted">
              <Search className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                「{initialQuery}」に一致する結果が見つかりませんでした
              </p>
            </div>
          )}

          {/* All tab */}
          {activeTab === "all" && totalCount > 0 && (
            <div className="flex flex-col gap-8">
              {results.bills.length > 0 && (
                <Section
                  title="議案"
                  icon={<FileText className="w-4 h-4" />}
                  total={results.bills.length}
                  expanded={!!expanded.bills}
                  onToggle={() => toggle("bills")}
                  initialCount={INITIAL_COUNT}
                >
                  {results.bills
                    .slice(0, expanded.bills ? undefined : INITIAL_COUNT)
                    .map((bill) => (
                      <BillCard key={bill.billId} bill={bill} />
                    ))}
                </Section>
              )}

              {results.questions.length > 0 && (
                <Section
                  title="一般質問"
                  icon={<MessageSquare className="w-4 h-4" />}
                  total={results.questions.length}
                  expanded={!!expanded.questions}
                  onToggle={() => toggle("questions")}
                  initialCount={INITIAL_COUNT}
                >
                  {results.questions
                    .slice(0, expanded.questions ? undefined : INITIAL_COUNT)
                    .map((q) => (
                      <QuestionCard key={q.id} question={q} />
                    ))}
                </Section>
              )}

              {results.pressConferences.length > 0 && (
                <Section
                  title="市長記者会見"
                  icon={<Megaphone className="w-4 h-4" />}
                  total={results.pressConferences.length}
                  expanded={!!expanded.press}
                  onToggle={() => toggle("press")}
                  initialCount={INITIAL_COUNT}
                >
                  {results.pressConferences
                    .slice(0, expanded.press ? undefined : INITIAL_COUNT)
                    .map((pc) => (
                      <PressCard key={pc.id} pc={pc} />
                    ))}
                </Section>
              )}
            </div>
          )}

          {/* Bills tab */}
          {activeTab === "bills" && (
            <TabSection
              items={results.bills}
              expanded={!!expanded["bills-tab"]}
              onToggle={() => toggle("bills-tab")}
              renderItem={(bill) => <BillCard key={bill.billId} bill={bill} />}
            />
          )}

          {/* Questions tab */}
          {activeTab === "questions" && (
            <TabSection
              items={results.questions}
              expanded={!!expanded["questions-tab"]}
              onToggle={() => toggle("questions-tab")}
              renderItem={(q) => <QuestionCard key={q.id} question={q} />}
            />
          )}

          {/* Press tab */}
          {activeTab === "press" && (
            <TabSection
              items={results.pressConferences}
              expanded={!!expanded["press-tab"]}
              onToggle={() => toggle("press-tab")}
              renderItem={(pc) => <PressCard key={pc.id} pc={pc} />}
            />
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  total,
  expanded,
  onToggle,
  initialCount,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  initialCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-mirai-text font-semibold">
        {icon}
        <span>{title}</span>
        <span className="text-xs font-normal text-mirai-text-muted">
          {total}件
        </span>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
      {total > initialCount && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="self-start text-primary-accent hover:text-primary-accent/80 px-0"
        >
          {expanded ? "折りたたむ" : `残り${total - initialCount}件を表示`}
          <ArrowRight
            className={`w-3.5 h-3.5 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </Button>
      )}
    </div>
  );
}

function TabSection<T>({
  items,
  expanded,
  onToggle,
  renderItem,
}: {
  items: T[];
  expanded: boolean;
  onToggle: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-mirai-text-muted text-center py-8">
        該当する結果がありません
      </p>
    );
  }
  const visible = expanded ? items : items.slice(0, TAB_INITIAL_COUNT);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">{visible.map(renderItem)}</div>
      {items.length > TAB_INITIAL_COUNT && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="self-start text-primary-accent hover:text-primary-accent/80 px-0"
        >
          {expanded
            ? "折りたたむ"
            : `残り${items.length - TAB_INITIAL_COUNT}件を表示`}
          <ArrowRight
            className={`w-3.5 h-3.5 ml-1 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </Button>
      )}
    </div>
  );
}

function BillCard({ bill }: { bill: BillSearchResult }) {
  return (
    <Link
      href={routes.billDetail(bill.billId)}
      className="group block rounded-xl border border-mirai-border bg-white px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-mirai-text-muted">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{bill.sessionName}</span>
        </div>
        <p className="text-sm font-semibold text-mirai-text leading-snug group-hover:text-primary-accent transition-colors line-clamp-2">
          {bill.title}
        </p>
        {bill.summary && (
          <p className="text-xs text-mirai-text-secondary leading-relaxed line-clamp-2">
            {bill.summary}
          </p>
        )}
        {bill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {bill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-mirai-surface px-2 py-0.5 rounded-full text-mirai-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function QuestionCard({ question }: { question: QuestionSearchResult }) {
  return (
    <Link
      href={routes.questionDetail(question.id)}
      className="group block rounded-xl border border-mirai-border bg-white px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-mirai-text-muted">
          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{question.sessionName}</span>
        </div>
        <p className="text-sm font-semibold text-mirai-text leading-snug group-hover:text-primary-accent transition-colors line-clamp-2">
          {question.firstTopicTitle}
        </p>
        <p className="text-xs text-mirai-text-muted">
          {question.questionerName}
          {question.questionerParty && (
            <span className="ml-1">（{question.questionerParty}）</span>
          )}
        </p>
      </div>
    </Link>
  );
}

function PressCard({ pc }: { pc: PressConferenceSearchResult }) {
  const formattedDate = new Date(pc.heldAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <Link
      href={routes.pressConferenceDetail(pc.slug)}
      className="group block rounded-xl border border-mirai-border bg-white px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-mirai-text-muted">
          <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <p className="text-sm font-semibold text-mirai-text leading-snug group-hover:text-primary-accent transition-colors line-clamp-2">
          {pc.title}
        </p>
      </div>
    </Link>
  );
}
