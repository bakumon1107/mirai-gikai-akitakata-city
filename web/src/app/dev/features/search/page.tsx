"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  MessageSquare,
  Mic,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── モックデータ ──────────────────────────────────────────

const MOCK_BILLS = [
  {
    id: "b1",
    session: "令和8年第1回定例会",
    title: "過疎地域持続的発展計画の策定について",
    summary:
      "国の過疎対策の枠組みを活用し、産業振興・生活環境整備・医療確保などを盛り込んだ市の5年間計画を策定する。",
    tags: ["行財政", "農業・産業"],
    publishedAt: "2026-03-01",
  },
  {
    id: "b2",
    session: "令和8年第1回定例会",
    title: "ふれあいセンターこうだ条例を廃止する条例",
    summary:
      "老朽化と利用者減少により閉館した高田地区のふれあいセンターこうだについて、設置条例を廃止する。",
    tags: ["地域コミュニティ", "行財政"],
    publishedAt: "2026-03-01",
  },
  {
    id: "b3",
    session: "令和7年第4回定例会",
    title: "令和7年度一般会計補正予算（第10号）",
    summary:
      "防災設備の更新、道路維持補修、子育て支援施設の整備費など総額2億3千万円を追加補正する。",
    tags: ["行財政", "防災・防犯"],
    publishedAt: "2025-12-15",
  },
  {
    id: "b4",
    session: "令和7年第4回定例会",
    title: "農業委員会の委員の任命について",
    summary:
      "任期満了に伴い、農業委員会委員14名を新たに任命する議案。農業者代表と認定農業者が含まれる。",
    tags: ["農業・産業"],
    publishedAt: "2025-12-15",
  },
  {
    id: "b5",
    session: "令和7年第3回定例会",
    title: "防災会議設置条例の一部を改正する条例",
    summary:
      "地域防災計画の見直しに合わせ、防災会議の委員構成と所掌事務を現行の法制度に適合させる。",
    tags: ["防災・防犯", "行財政"],
    publishedAt: "2025-09-10",
  },
];

const MOCK_QUESTIONS = [
  {
    id: "q1",
    session: "令和8年第1回定例会",
    questioner: "田邊 昭夫 議員",
    party: "チームみらい",
    topic: "農業の担い手確保と耕作放棄地対策について",
    summary:
      "高齢化による農業従事者の減少と耕作放棄地の増加に対し、新規就農支援策や農地集積・集約化の方針を問う。",
    sessionDate: "2026-03-05",
  },
  {
    id: "q2",
    session: "令和8年第1回定例会",
    questioner: "沖田 三記雄 議員",
    party: "無所属",
    topic: "移住定住政策の現状と課題について",
    summary:
      "移住者数の推移と定着率、移住支援金の活用状況、若者や子育て世代を呼び込むための施策強化を問う。",
    sessionDate: "2026-03-06",
  },
  {
    id: "q3",
    session: "令和7年第4回定例会",
    questioner: "山根 温子 議員",
    party: "無所属",
    topic: "子育て支援の充実について",
    summary:
      "保育士不足の解消策、放課後児童クラブの定員拡充、子どもの医療費助成拡大に関する市の考え方を問う。",
    sessionDate: "2025-12-10",
  },
  {
    id: "q4",
    session: "令和7年第4回定例会",
    questioner: "熊高 昌三 議員",
    party: "無所属",
    topic: "道路整備と交通安全対策について",
    summary:
      "市内幹線道路の舗装補修の優先順位づけと、通学路の危険箇所解消に向けた取り組みの進捗を問う。",
    sessionDate: "2025-12-11",
  },
  {
    id: "q5",
    session: "令和7年第3回定例会",
    questioner: "松浦 誠 議員",
    party: "無所属",
    topic: "地域防災力の強化について",
    summary:
      "自主防災組織の活動状況と消防団員の確保策、大規模水害を想定した避難計画の実効性を問う。",
    sessionDate: "2025-09-08",
  },
];

const MOCK_PRESS_CONFERENCES = [
  {
    id: "pc1",
    title: "安芸高田市長定例記者会見（令和8年3月）",
    heldAt: "2026-03-23",
  },
  {
    id: "pc2",
    title: "安芸高田市長定例記者会見（令和7年12月）",
    heldAt: "2025-12-20",
  },
  {
    id: "pc3",
    title: "安芸高田市長定例記者会見（令和7年9月）",
    heldAt: "2025-09-22",
  },
];

// ── ユーティリティ ────────────────────────────────────────

function matches(texts: string[], keyword: string): boolean {
  const q = keyword.toLowerCase();
  return texts.some((t) => t.toLowerCase().includes(q));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── カードコンポーネント ──────────────────────────────────

function BillResultCard({ bill }: { bill: (typeof MOCK_BILLS)[number] }) {
  return (
    <div className="border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors cursor-pointer">
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
      <div className="flex flex-wrap gap-1">
        {bill.tags.map((tag) => (
          <Badge key={tag} variant="muted" className="text-xs">
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function QuestionResultCard({
  question,
}: {
  question: (typeof MOCK_QUESTIONS)[number];
}) {
  return (
    <div className="border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="size-4 text-mirai-text-muted shrink-0" />
        <span className="text-xs text-mirai-text-muted">
          一般質問 · {question.questioner} · {question.session}
        </span>
      </div>
      <p className="font-medium text-mirai-text text-sm leading-snug mb-2">
        {question.topic}
      </p>
      <p className="text-xs text-mirai-text-secondary line-clamp-2">
        {question.summary}
      </p>
    </div>
  );
}

function PressConferenceResultCard({
  pc,
}: {
  pc: (typeof MOCK_PRESS_CONFERENCES)[number];
}) {
  return (
    <div className="border border-mirai-border rounded-lg p-4 bg-white hover:bg-mirai-surface transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <Mic className="size-4 text-mirai-text-muted shrink-0" />
        <span className="text-xs text-mirai-text-muted">
          記者会見 · {formatDate(pc.heldAt)}
        </span>
      </div>
      <p className="font-medium text-mirai-text text-sm leading-snug">
        {pc.title}
      </p>
    </div>
  );
}

// ── セクション（カテゴリ別）────────────────────────────────

const SECTION_LIMIT = 3;

function ResultSection<T>({
  title,
  items,
  renderCard,
}: {
  title: string;
  items: T[];
  renderCard: (item: T) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, SECTION_LIMIT);
  const hasMore = items.length > SECTION_LIMIT;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mirai-text-secondary">
          {title}
          <span className="ml-2 text-mirai-text-muted font-normal">
            {items.length}件
          </span>
        </h2>
      </div>
      <div className="flex flex-col gap-3">
        {visible.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: dev only
          <div key={i}>{renderCard(item)}</div>
        ))}
      </div>
      {hasMore && !expanded && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full text-mirai-text-muted border border-mirai-border"
          onClick={() => setExpanded(true)}
        >
          <ChevronDown className="size-4 mr-1" />
          残り{items.length - SECTION_LIMIT}件を表示
        </Button>
      )}
    </section>
  );
}

// ── タブ ─────────────────────────────────────────────────

type TabKey = "all" | "bills" | "questions" | "press";

const TAB_LABELS: Record<TabKey, string> = {
  all: "すべて",
  bills: "議案",
  questions: "一般質問",
  press: "記者会見",
};

// ── メインページ ──────────────────────────────────────────

export default function SearchPreviewPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabKey>("all");

  const keyword = query.trim();

  const filteredBills = useMemo(
    () =>
      keyword
        ? MOCK_BILLS.filter((b) =>
            matches([b.title, b.summary, ...b.tags], keyword)
          )
        : MOCK_BILLS,
    [keyword]
  );

  const filteredQuestions = useMemo(
    () =>
      keyword
        ? MOCK_QUESTIONS.filter((q) =>
            matches([q.topic, q.summary, q.questioner], keyword)
          )
        : MOCK_QUESTIONS,
    [keyword]
  );

  const filteredPress = useMemo(
    () =>
      keyword
        ? MOCK_PRESS_CONFERENCES.filter((pc) => matches([pc.title], keyword))
        : MOCK_PRESS_CONFERENCES,
    [keyword]
  );

  const totalCount =
    filteredBills.length + filteredQuestions.length + filteredPress.length;

  const tabs: { key: TabKey; count: number }[] = [
    { key: "all", count: totalCount },
    { key: "bills", count: filteredBills.length },
    { key: "questions", count: filteredQuestions.length },
    { key: "press", count: filteredPress.length },
  ];

  const isEmpty = totalCount === 0 && keyword !== "";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-mirai-text mb-2">
        検索 UI プロトタイプ
      </h1>
      <p className="text-sm text-mirai-text-muted mb-6">
        モックデータで動作確認できます。「農業」「防災」「道路」などを試してください。
      </p>

      {/* 検索バー */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-mirai-text-muted" />
        <Input
          type="search"
          placeholder="キーワードを入力..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTab("all");
          }}
          className="pl-9 h-11 text-base bg-white border-mirai-border"
        />
      </div>

      {/* 件数表示 */}
      <p className="text-xs text-mirai-text-muted mb-4 h-4">
        {keyword &&
          !isEmpty &&
          `"${keyword}" の検索結果  全 ${totalCount} 件（新しい順）`}
      </p>

      {/* タブ */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
              tab === key
                ? "bg-mirai-text text-white border-mirai-text"
                : "bg-white text-mirai-text-secondary border-mirai-border hover:bg-mirai-surface",
            ].join(" ")}
          >
            {TAB_LABELS[key]}
            {keyword && (
              <span
                className={[
                  "ml-1.5 text-xs",
                  tab === key ? "text-white/70" : "text-mirai-text-muted",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 検索前の状態 */}
      {!keyword && (
        <div className="text-center py-16 text-mirai-text-muted">
          <Search className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            キーワードを入力すると検索結果が表示されます
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["農業", "防災", "道路", "子育て", "移住", "予算"].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => setQuery(kw)}
                className="px-3 py-1 text-xs border border-mirai-border rounded-full text-mirai-text-secondary hover:bg-mirai-surface transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 0件 */}
      {isEmpty && (
        <div className="text-center py-16 text-mirai-text-muted">
          <p className="text-sm font-medium text-mirai-text mb-1">
            「{keyword}」に一致する結果はありませんでした
          </p>
          <p className="text-xs">別のキーワードで試してみてください</p>
        </div>
      )}

      {/* 検索結果 */}
      {keyword && !isEmpty && (
        <div className="flex flex-col gap-8">
          {(tab === "all" || tab === "bills") && filteredBills.length > 0 && (
            <ResultSection
              title="議案"
              items={filteredBills}
              renderCard={(bill) => <BillResultCard bill={bill} />}
            />
          )}
          {(tab === "all" || tab === "questions") &&
            filteredQuestions.length > 0 && (
              <ResultSection
                title="一般質問"
                items={filteredQuestions}
                renderCard={(q) => <QuestionResultCard question={q} />}
              />
            )}
          {(tab === "all" || tab === "press") && filteredPress.length > 0 && (
            <ResultSection
              title="記者会見"
              items={filteredPress}
              renderCard={(pc) => <PressConferenceResultCard pc={pc} />}
            />
          )}
        </div>
      )}
    </div>
  );
}
