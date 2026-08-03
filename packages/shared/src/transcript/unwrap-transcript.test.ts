import { describe, expect, it } from "vitest";
import {
  normalizeTranscriptText,
  unwrapTranscriptLines,
} from "./unwrap-transcript";

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

  it("文が終わっている行の後の空行は段落の区切りになる", () => {
    const paragraphs = unwrapTranscriptLines(WRAPPED_TRANSCRIPT);

    expect(paragraphs).toContain(
      "そこで以下の点について、市長の見解を伺います。"
    );
  });

  it("ページ替わりの空行では文の途中の段落を分断しない", () => {
    // 空行を挟んで字下げの基準も変わる（9 → 11）のがページ替わりの特徴
    const text = [
      "◯秋 田 議 員  お伺いをいたします。",
      "          まず、（1）で第4次行政改革推進実施計画では、公営企業の経営健全",
      "         化の目標効果として、一般会計繰入金補助金の削減があり、また、2026",
      "         年度予算編成方針でも、重点的に検討する項目で、公営企業会計補助金",
      "",
      "           の縮減があります。具体的には、財源を安易に一般会計に依存すること",
      "           なく、より効果的な運用に努め、基準外繰り出しを縮減するとされてい",
      "           ます。",
    ].join("\n");

    expect(unwrapTranscriptLines(text)).toEqual([
      "◯秋 田 議 員  お伺いをいたします。",
      "まず、（1）で第4次行政改革推進実施計画では、公営企業の経営健全化の目標効果として、一般会計繰入金補助金の削減があり、また、2026年度予算編成方針でも、重点的に検討する項目で、公営企業会計補助金の縮減があります。具体的には、財源を安易に一般会計に依存することなく、より効果的な運用に努め、基準外繰り出しを縮減するとされています。",
    ]);
  });

  it("行末まで埋まっていなくても文の途中なら次の行と連結する", () => {
    // 4行目は折り返し幅に達していないが「向き」で終わっており文の途中
    const text = [
      "◯藤 本 市 長    金行議員の質問にお答えいたします。",
      "           就任以来、対話からの前進を市政運営の柱として掲げ、対話集会を実施",
      "           する中で、様々な御意見やお声に耳を傾けながら、市政の課題に向き",
      "           合ってまいりました。",
      "             以上です。",
    ].join("\n");

    expect(unwrapTranscriptLines(text)).toEqual([
      "◯藤 本 市 長    金行議員の質問にお答えいたします。",
      "就任以来、対話からの前進を市政運営の柱として掲げ、対話集会を実施する中で、様々な御意見やお声に耳を傾けながら、市政の課題に向き合ってまいりました。",
      "以上です。",
    ]);
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

describe("normalizeTranscriptText", () => {
  it("1段落1行のテキストに整形する", () => {
    const normalized = normalizeTranscriptText(WRAPPED_TRANSCRIPT);

    expect(normalized.split("\n")).toEqual(
      unwrapTranscriptLines(WRAPPED_TRANSCRIPT)
    );
    expect(normalized).toContain(
      "本市では、財源確保とブランド力向上を目的として、2025年、昨年10月よりネーミングライツ制度を導入されました。"
    );
  });

  it("正規化済みのテキストを再度通しても変化しない（冪等）", () => {
    const once = normalizeTranscriptText(WRAPPED_TRANSCRIPT);

    expect(normalizeTranscriptText(once)).toBe(once);
  });

  it("空白を除いた本文は正規化前後で変化しない", () => {
    const before = WRAPPED_TRANSCRIPT.replace(/\s/g, "");
    const after = normalizeTranscriptText(WRAPPED_TRANSCRIPT).replace(
      /\s/g,
      ""
    );

    expect(after).toBe(before);
  });
});
