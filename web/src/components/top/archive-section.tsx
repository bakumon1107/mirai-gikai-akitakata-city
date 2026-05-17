"use client";

import { useState } from "react";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import type { CommunityConsultationListItem } from "@/features/community-consultations/shared/types";
import type { PressConference } from "@/features/press-conferences/shared/types";
import { ArchiveBillsTab } from "./archive-bills-tab";
import { ArchiveConsultationsTab } from "./archive-consultations-tab";
import { ArchivePressConferencesTab } from "./archive-press-conferences-tab";
import { ArchiveQuestionsTab } from "./archive-questions-tab";

type TabKey = "bills" | "questions" | "press-conferences" | "consultations";

const TABS: { key: TabKey; label: string }[] = [
  { key: "bills", label: "議案一覧" },
  { key: "questions", label: "一般質問一覧" },
  { key: "press-conferences", label: "市長記者会見一覧" },
  { key: "consultations", label: "地域懇談会一覧" },
];

interface ArchiveSectionProps {
  sessions: CouncilSession[];
  questionSessions: CouncilSession[];
  pressConferences: PressConference[];
  consultations: CommunityConsultationListItem[];
}

export function ArchiveSection({
  sessions,
  questionSessions,
  pressConferences,
  consultations,
}: ArchiveSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("bills");

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
          アーカイブ
        </h2>
      </div>

      {/* ラジオボタン */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <label
            key={tab.key}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <input
              type="radio"
              name="archive-tab"
              value={tab.key}
              checked={activeTab === tab.key}
              onChange={() => setActiveTab(tab.key)}
              className="accent-primary-accent"
            />
            <span
              className={`text-sm font-medium ${
                activeTab === tab.key
                  ? "text-primary-accent"
                  : "text-mirai-text-muted"
              }`}
            >
              {tab.label}
            </span>
          </label>
        ))}
      </div>

      {/* タブコンテンツ */}
      {activeTab === "bills" && <ArchiveBillsTab sessions={sessions} />}
      {activeTab === "questions" && (
        <ArchiveQuestionsTab sessions={questionSessions} />
      )}
      {activeTab === "press-conferences" && (
        <ArchivePressConferencesTab pressConferences={pressConferences} />
      )}
      {activeTab === "consultations" && (
        <ArchiveConsultationsTab consultations={consultations} />
      )}
    </section>
  );
}
