import { describe, expect, it } from "vitest";
import type { GeneralQuestionTopic } from "../types";
import {
  findTopicBoundaries,
  normalizeDisplayName,
  parseSpeakerTurns,
  unwrapTranscriptLines,
} from "./parse-transcript";

// 議事録PDFの実データを模した固定幅折り返しテキスト（全角換算で約72幅で折り返す）。
// 段落の先頭行は続き行より1文字深くインデントされる。
const WRAPPED_TRANSCRIPT = [
  "8番、新田議員。",
  "◯新 田 議 員  おはようございます。8番、新田和明でございます。",
  "          通告に基づき、大枠4点について質問いたします。",
  "          それでは質問に入ります。まず最初の質問であります。ネーミングラ",
  "         イツ導入の課題と今後の展開について。",
  "          本市では、財源確保とブランド力向上を目的として、2025年、昨年10",
  "         月よりネーミングライツ制度を導入されました。",
  "          元就の里リレーマラソンでは、イベント対象として110万円の契約金",
  "         のほか、現在では二つの企業から年間272万円、5年間では1,360万円の",
  "         命名権料となっています。",
  "          今後、この制度をさらに発展させ、市全体のブランド価値を高めてい",
  "         くためには、より多くの企業に参画していただく仕組みづくりが重要と",
  "         考えます。",
  "",
  "             そこで以下の点について、市長の見解を伺います。",
  "             現在の状況と課題について、導入されたネーミングライツの現状につ",
  "           いて伺います。",
  "◯藤 本 市 長     皆さんおはようございます。今日と月曜日の2日間にわたって一般質",
  "           問ですけども、どうかよろしくお願いいたします。",
  "             新田議員の質問にお答えいたします。",
  "             ネーミングライツ事業については、これまではイベントでは「ＮＡＮ",
  "           ＪＯ キズナのわ 元就の里リレーマラソン2025」そして公共施設では、",
  "           市民文化センターの大ホール、小ホールに「マルシン クリスタルアー",
  "           ジョ」大ホール及び小ホール、吉田運動公園に「ＳＴＡＲＬＩＴＥ ウ",
  "           ィクトーリアスポーツパーク」とそれぞれに愛称を命名いただいており",
  "           ます。",
  "             現在、いずれの名称も市民の皆様に親しまれ、愛着を持って広く呼称",
  "           されております。",
  "             以上です。",
].join("\n");

describe("unwrapTranscriptLines", () => {
  it("折り返し行を連結し、インデントが深い行から新しい段落を始める", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);

    expect(paragraphs).toContain(
      "それでは質問に入ります。まず最初の質問であります。ネーミングライツ導入の課題と今後の展開について。"
    );
    expect(paragraphs).toContain(
      "本市では、財源確保とブランド力向上を目的として、2025年、昨年10月よりネーミングライツ制度を導入されました。"
    );
    expect(paragraphs).toContain(
      "通告に基づき、大枠4点について質問いたします。"
    );
  });

  it("5行にまたがる段落も1つに連結する", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);

    expect(paragraphs).toContain(
      "ネーミングライツ事業については、これまではイベントでは「ＮＡＮＪＯ キズナのわ 元就の里リレーマラソン2025」そして公共施設では、市民文化センターの大ホール、小ホールに「マルシン クリスタルアージョ」大ホール及び小ホール、吉田運動公園に「ＳＴＡＲＬＩＴＥ ウィクトーリアスポーツパーク」とそれぞれに愛称を命名いただいております。"
    );
  });

  it("話者マーク行は必ず新しい段落として扱う", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);
    const speakerLines = paragraphs.filter((p) => p.startsWith("◯"));

    expect(speakerLines).toHaveLength(2);
    expect(speakerLines[1]).toContain("◯藤 本 市 長");
  });

  it("話者マーク行の直後の折り返し行も連結する", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);

    expect(paragraphs).toContain(
      "◯藤 本 市 長     皆さんおはようございます。今日と月曜日の2日間にわたって一般質問ですけども、どうかよろしくお願いいたします。"
    );
  });

  it("空行は段落の区切りになる", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);

    expect(paragraphs).toContain(
      "そこで以下の点について、市長の見解を伺います。"
    );
  });

  it("折り返しではない文章（段落ごとに1行）は連結しない", () => {
    // 行幅が大きくばらつく＝固定幅で折り返されていない文章
    const lines = [
      "◯新 田 議 員  おはようございます。8番、新田和明でございます。",
      "　通告に基づき、大枠4点について質問いたします。",
      "　本市では、財源確保とブランド力向上を目的として、2025年、昨年10月よりネーミングライツ制度を導入されました。元就の里リレーマラソンでは、イベント対象として110万円の契約金のほか、現在では二つの企業から年間272万円、5年間では1,360万円の命名権料となっています。",
      "　今後、この制度をさらに発展させ、市全体のブランド価値を高めていくためには、より多くの企業に参画していただく仕組みづくりが重要と考えます。",
      "　そこで以下の点について、市長の見解を伺います。",
      "◯藤 本 市 長  お答えいたします。",
      "　現在、いずれの名称も市民の皆様に親しまれ、愛着を持って広く呼称されております。",
      "　以上です。",
    ];

    expect(unwrapTranscriptLines(lines.join("\n"))).toEqual(
      lines.map((line) => line.trim())
    );
  });

  it("空文字列は空配列を返す", () => {
    expect(unwrapTranscriptLines("")).toEqual([]);
  });
});

describe("normalizeDisplayName", () => {
  it("CJK文字間のスペースを除去する", () => {
    expect(normalizeDisplayName("新 田 議 員")).toBe("新田議員");
  });

  it("スペースのない名前はそのまま返す", () => {
    expect(normalizeDisplayName("井上福祉保健部長")).toBe("井上福祉保健部長");
  });
});

describe("parseSpeakerTurns", () => {
  it("話者ごとに発言を段落配列として組み立てる", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);

    expect(turns).toHaveLength(2);
    expect(turns[0].displayName).toBe("新田議員");
    expect(turns[0].isQuestioner).toBe(true);
    expect(turns[0].paragraphs[0]).toBe(
      "おはようございます。8番、新田和明でございます。"
    );
    expect(turns[1].displayName).toBe("藤本市長");
    expect(turns[1].isQuestioner).toBe(false);
  });

  it("折り返し改行を除去しても本文の文字は失われない", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);
    const joined = turns
      .flatMap((turn) => turn.paragraphs)
      .join("")
      .replace(/\s/g, "");

    expect(joined).toContain(
      "ネーミングライツ導入の課題と今後の展開について。"
    );
    expect(joined).toContain("愛着を持って広く呼称されております。");
  });

  it("議長の発言は除外する", () => {
    const text = [
      "◯議 長  日程第2、一般質問を行います。",
      "◯新 田 議 員  8番、新田和明でございます。",
    ].join("\n");
    const turns = parseSpeakerTurns(text);

    expect(turns).toHaveLength(1);
    expect(turns[0].displayName).toBe("新田議員");
  });

  it("話者マークより前の行は捨てる", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);

    expect(turns[0].paragraphs).not.toContain("8番、新田議員。");
  });
});

describe("findTopicBoundaries", () => {
  const buildTopic = (
    title: string,
    rawQuestion: string
  ): GeneralQuestionTopic => ({
    title,
    question_summary: "",
    answer_summary: "",
    answerer_role: "市長",
    answerer_name: "藤本",
    raw_question: rawQuestion,
  });

  it("raw_question の先頭でトピック開始ターンを特定する", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);
    const boundaries = findTopicBoundaries(turns, [
      buildTopic(
        "ネーミングライツについて",
        "それでは質問に入ります。まず最初の質問であります。"
      ),
    ]);

    expect(boundaries.get(0)).toBe("ネーミングライツについて");
  });

  it("折り返しをまたぐ位置でもトピックを特定できる", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);
    // "ネーミングライツ導入の課題と" は元データでは行をまたいで分断されている
    const boundaries = findTopicBoundaries(turns, [
      buildTopic("導入の課題について", "ネーミングライツ導入の課題と"),
    ]);

    expect(boundaries.get(0)).toBe("導入の課題について");
  });

  it("マッチしないトピックは境界を作らない", () => {
    const turns = parseSpeakerTurns(WRAPPED_TRANSCRIPT);
    const boundaries = findTopicBoundaries(turns, [
      buildTopic("無関係", "全く登場しない文言です。"),
    ]);

    expect(boundaries.size).toBe(0);
  });
});
