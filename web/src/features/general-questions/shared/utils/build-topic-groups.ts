import type { GeneralQuestion, GeneralQuestionTopic } from "../types";

export type TopicEntry = {
  title: string;
  questionSummary: string;
  answerSummary: string;
  answererRole: string;
  answererName: string;
  topicCount: number;
  questioner: {
    id: string;
    name: string;
    party: string | null;
  };
};

export type TopicGroup = {
  categoryLabel: string;
  iconName: string;
  entries: TopicEntry[];
};

const CATEGORY_MAP: Array<{
  label: string;
  iconName: string;
  keywords: string[];
}> = [
  {
    label: "子育て・教育",
    iconName: "Baby",
    keywords: [
      "保育",
      "子ども",
      "給食",
      "学校",
      "育児",
      "児童",
      "教育",
      "不登校",
      "教員",
      "修学",
      "進路",
      "学び",
      "義務教育",
      "小中一貫",
      "過疎",
      "放課後",
    ],
  },
  {
    label: "健康・医療",
    iconName: "Stethoscope",
    keywords: [
      "ワクチン",
      "医療",
      "コロナ",
      "健康",
      "HPV",
      "衛生",
      "後遺症",
      "肺炎",
      "接種",
      "病院",
      "診療所",
      "産婦人科",
    ],
  },
  {
    label: "防災・安全",
    iconName: "Shield",
    keywords: [
      "耐震",
      "避難",
      "防災",
      "減災",
      "災害",
      "安全",
      "火災",
      "発令",
      "警報",
      "注意報",
      "林野",
      "土砂",
      "豪雨",
      "山地",
    ],
  },
  {
    label: "高齢者・福祉",
    iconName: "Heart",
    keywords: [
      "高齢者",
      "移動支援",
      "国民健康保険",
      "デジタルデバイド",
      "福祉",
      "介護",
      "障害",
      "老人",
      "孤立",
      "独居",
      "限界集落",
    ],
  },
  {
    label: "交通・まちづくり",
    iconName: "Building2",
    keywords: [
      "交通",
      "道路",
      "鉄道",
      "バス",
      "まちづくり",
      "再開発",
      "橋梁",
      "住宅",
      "路線",
      "デマンド",
      "高速道路",
      "渋滞",
    ],
  },
  {
    label: "環境・脱炭素",
    iconName: "Leaf",
    keywords: [
      "太陽光",
      "省エネ",
      "カーボン",
      "再生可能",
      "環境保全",
      "脱炭素",
      "ゼロカーボン",
      "温室効果",
      "林業",
      "間伐",
      "竹林",
      "獣害",
      "ごみ",
    ],
  },
  {
    label: "スポーツ・文化",
    iconName: "Trophy",
    keywords: [
      "スポーツ",
      "文化",
      "博物館",
      "公民館",
      "毛利",
      "歴史",
      "史跡",
      "観光",
      "アスリート",
    ],
  },
  {
    label: "地域・国際交流",
    iconName: "Globe",
    keywords: [
      "農業",
      "地域",
      "移住",
      "UIターン",
      "定住促進",
      "国際",
      "外国人",
      "多文化",
      "共生",
      "漁業",
      "動物",
      "愛護",
      "自治会",
      "町内会",
    ],
  },
];

export function assignCategory(topicTitle: string): {
  label: string;
  iconName: string;
} {
  for (const cat of CATEGORY_MAP) {
    if (cat.keywords.some((kw) => topicTitle.includes(kw))) {
      return { label: cat.label, iconName: cat.iconName };
    }
  }
  return { label: "その他", iconName: "Circle" };
}

function buildEntry(
  q: GeneralQuestion,
  topics: GeneralQuestionTopic[]
): TopicEntry {
  const first = topics[0];
  const useBlockSummary = !!first.block_summary;
  return {
    title: first.title,
    questionSummary: first.question_summary,
    answerSummary: first.block_summary ?? first.answer_summary,
    answererRole: useBlockSummary ? "" : first.answerer_role,
    answererName: useBlockSummary ? "" : first.answerer_name,
    topicCount: topics.length,
    questioner: {
      id: q.id,
      name: q.questioner_name,
      party: q.questioner_party,
    },
  };
}

export function buildTopicGroups(questions: GeneralQuestion[]): TopicGroup[] {
  // Group consecutive same-category topics per questioner into blocks.
  const blocks: Array<{
    q: GeneralQuestion;
    topics: GeneralQuestionTopic[];
    iconName: string;
    categoryLabel: string;
  }> = [];

  for (const q of questions) {
    let currentBlock: (typeof blocks)[0] | null = null;

    for (const t of q.topics) {
      const { label, iconName } = assignCategory(t.title);

      if (currentBlock && currentBlock.categoryLabel === label) {
        currentBlock.topics.push(t);
      } else {
        currentBlock = { q, topics: [t], iconName, categoryLabel: label };
        blocks.push(currentBlock);
      }
    }
  }

  const categoryMap = new Map<string, TopicGroup>();

  for (const { q, topics, iconName, categoryLabel } of blocks) {
    const entry = buildEntry(q, topics);
    const existing = categoryMap.get(categoryLabel);
    if (existing) {
      existing.entries.push(entry);
    } else {
      categoryMap.set(categoryLabel, {
        categoryLabel,
        iconName,
        entries: [entry],
      });
    }
  }

  const orderedLabels = [...CATEGORY_MAP.map((c) => c.label), "その他"].filter(
    (l) => categoryMap.has(l)
  );

  return orderedLabels.map((l) => categoryMap.get(l) as TopicGroup);
}
