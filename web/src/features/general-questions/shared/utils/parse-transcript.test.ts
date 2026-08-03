import { describe, expect, it } from "vitest";
import type { GeneralQuestionTopic } from "../types";
import {
  findTopicBoundaries,
  normalizeDisplayName,
  parseSpeakerTurns,
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

  // 折り返し判定が働かない（＝段落ごとに1行の）テキストにするための長い段落
  const LONG_PARAGRAPH =
    "　安芸高田市内の児童クラブの数は10施設で16支援あります。平日利用と長期休業期間利用を合わせた定員数は615人となっています。利用者数については時期によって若干の増減がありますが、直近2月1日時点での利用者は510人、定員に対して約83％の利用割合となっております。";

  it("議長の指名行は直前の発言に混ぜない", () => {
    const text = [
      "◯藤 本 市 長  小松議員の質問にお答えいたします。",
      LONG_PARAGRAPH,
      "　以上です。",
      "　小松議員。",
      "◯小 松 議 員  83％とお聞きいたしました。",
    ].join("\n");
    const turns = parseSpeakerTurns(text);

    expect(turns[0].paragraphs).toEqual([
      "小松議員の質問にお答えいたします。",
      LONG_PARAGRAPH.trim(),
      "以上です。",
    ]);
    expect(turns[1].paragraphs).toEqual(["83％とお聞きいたしました。"]);
  });

  it("番号付きの指名行・職務代理者の指名行も除外する", () => {
    const text = [
      "◯藤 本 市 長  お答えいたします。",
      LONG_PARAGRAPH,
      "　8番、新田議員。",
      "　迫広教育長職務代理者。",
    ].join("\n");
    const turns = parseSpeakerTurns(text);

    expect(turns[0].paragraphs).toEqual([
      "お答えいたします。",
      LONG_PARAGRAPH.trim(),
    ]);
  });

  it("指名行に似た通常の発言は除外しない", () => {
    const text = [
      "◯新 田 議 員  質問いたします。",
      LONG_PARAGRAPH,
      "　以上です。",
      "　これで私の一般質問を終わります。",
    ].join("\n");
    const turns = parseSpeakerTurns(text);

    expect(turns[0].paragraphs).toEqual([
      "質問いたします。",
      LONG_PARAGRAPH.trim(),
      "以上です。",
      "これで私の一般質問を終わります。",
    ]);
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
