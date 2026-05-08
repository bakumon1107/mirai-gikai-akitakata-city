import { describe, expect, it } from "vitest";
import { assignCategory, buildTopicGroups } from "./build-topic-groups";
import type { GeneralQuestion } from "../types";

describe("assignCategory", () => {
  it("保育所 → 子育て・教育", () => {
    expect(assignCategory("保育所の待機児童対策").label).toBe("子育て・教育");
  });
  it("耐震 → 防災・安全", () => {
    expect(assignCategory("木造密集市街地の耐震化促進").label).toBe(
      "防災・安全"
    );
  });
  it("マッチしない → その他", () => {
    expect(assignCategory("特になし").label).toBe("その他");
  });
  it("林業 → 環境・脱炭素", () => {
    expect(assignCategory("林業振興と間伐材の活用").label).toBe("環境・脱炭素");
  });
  it("移住 → 地域・国際交流", () => {
    expect(assignCategory("移住定住促進策について").label).toBe(
      "地域・国際交流"
    );
  });
});

const mockQuestion: GeneralQuestion = {
  id: "q-001",
  council_session_id: "session-1",
  questioner_name: "山田花子",
  questioner_party: "テスト会派",
  questioner_number: 1,
  session_day: 1,
  question_order: 1,
  summary: "保育所の待機児童解消と耐震化促進について質問。",
  topics: [
    {
      title: "保育所の待機児童対策",
      question_summary: "待機児童の解消策は？",
      answer_summary: "令和9年度中に解消予定。",
      answerer_role: "市民生活部長",
      answerer_name: "田中一郎",
    },
    {
      title: "木造密集市街地の耐震化促進",
      question_summary: "補助を拡充せよ。",
      answer_summary: "令和8年度から150万円に引き上げ。",
      answerer_role: "建設部長",
      answerer_name: "松本雅彦",
    },
  ],
  raw_text: null,
  source_url: null,
  publish_status: "published",
  created_at: "2026-04-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

describe("buildTopicGroups", () => {
  it("トピックをカテゴリ別に分類する", () => {
    const groups = buildTopicGroups([mockQuestion]);
    const labels = groups.map((g) => g.categoryLabel);
    expect(labels).toContain("子育て・教育");
    expect(labels).toContain("防災・安全");
  });

  it("各グループにentryが含まれる", () => {
    const groups = buildTopicGroups([mockQuestion]);
    const childCare = groups.find((g) => g.categoryLabel === "子育て・教育");
    expect(childCare?.entries).toHaveLength(1);
    expect(childCare?.entries[0].questioner.id).toBe("q-001");
  });

  it("単一トピックのカードはtopicCount=1でトピック名をtitleに使う", () => {
    const groups = buildTopicGroups([mockQuestion]);
    const childCare = groups.find((g) => g.categoryLabel === "子育て・教育");
    const entry = childCare?.entries[0];
    expect(entry?.topicCount).toBe(1);
    expect(entry?.title).toBe("保育所の待機児童対策");
  });

  it("同一議員・同一カテゴリの複数トピックは1枚にマージされる", () => {
    const q: GeneralQuestion = {
      id: "q-002",
      council_session_id: "session-1",
      questioner_name: "佐藤太郎",
      questioner_party: null,
      questioner_number: 2,
      session_day: 1,
      question_order: 2,
      summary: "土砂災害と豪雨対策について。",
      topics: [
        {
          title: "土砂災害ハザードマップの更新について",
          question_summary: "更新の時期は？",
          answer_summary: "令和7年度中に更新予定。",
          answerer_role: "建設部長",
          answerer_name: "鈴木一郎",
        },
        {
          title: "豪雨時の避難所開設基準について",
          question_summary: "避難所開設の判断基準は？",
          answer_summary: "警戒レベル3で開設する。",
          answerer_role: "総務部長",
          answerer_name: "田中次郎",
        },
      ],
      raw_text: null,
      source_url: null,
      publish_status: "published",
      created_at: "2026-04-01T00:00:00Z",
      updated_at: "2026-04-01T00:00:00Z",
    };

    const groups = buildTopicGroups([q]);
    const bousai = groups.find((g) => g.categoryLabel === "防災・安全");
    expect(bousai?.entries).toHaveLength(1);
    expect(bousai?.entries[0].topicCount).toBe(2);
  });

  it("空配列は空グループを返す", () => {
    expect(buildTopicGroups([])).toHaveLength(0);
  });
});
