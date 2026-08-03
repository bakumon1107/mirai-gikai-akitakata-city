/**
 * prepare-gq-prompts.ts
 *
 * PDFテキストを議員ごとのセクションファイルに分割して /tmp/gq-sections/ に保存する。
 * Claude（チャット）がこれを Read してJSON生成するための前処理スクリプト。
 *
 * 使い方:
 *   tsx akitakata/prepare-gq-prompts.ts <minutes.txt> <session_slug> <session_day>
 *   例: tsx akitakata/prepare-gq-prompts.ts /tmp/gq-r8-1-day1.txt r8-1 1
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── テキスト前処理 ──────────────────────────────────────────

// ページ番号や【速報版】などのノイズだけを落とす。
// 議長のターンは残すこと（落とすと「分かりました。」のような応答が
// 何に対するものか分からなくなる。表示側で定型句のみのものを除外している）。
function cleanMinutesText(text: string): string {
  return text
    .replace(/\f/g, "")                                         // フォームフィード除去
    .replace(/^[ \t]*\d+[ \t]*\n[ \t]*【速報版】[ \t]*\n?/gm, "")
    .replace(/^[ \t]*【速報版】[ \t]*$/gm, "")
    .replace(/^[ \t]*\d{1,3}[ \t]*$/gm, "")
    .replace(/^[ \t]+$/gm, "")                                  // 空白のみの行を除去
    .replace(/\n{3,}/g, "\n\n");
}

// ─── 出席議員一覧からフルネームマップを構築 ──────────────────

function buildMemberNameMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const startIdx = text.indexOf("出席議員は次のとおりである");
  if (startIdx < 0) return map;
  const sectionText = text.slice(startIdx, startIdx + 1000);
  const toHalf = (s: string) =>
    s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));
  const ENTRY_RE = /([０-９]{1,2})番[ 　]{1,8}((?:[^\s０-９\d\n]+[ 　]*){1,4})/g;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_RE.exec(sectionText)) !== null) {
    const num = parseInt(toHalf(m[1]), 10);
    const name = m[2].replace(/\s/g, "").trim();
    if (!isNaN(num) && name.length >= 2 && name.length <= 8) map.set(num, name);
  }
  return map;
}

// ─── テキスト分割 ────────────────────────────────────────────

function splitByQuestioner(text: string, fullText = text) {
  const memberNameMap = buildMemberNameMap(fullText);
  const SECTION_START_RE =
    /([0-9０-９]+)\s*番[、，\s]([^\n。]{1,10}?)議員[。\n]/g;
  const matches: Array<{ pos: number; num: string; name: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = SECTION_START_RE.exec(text)) !== null) {
    matches.push({ pos: m.index, num: m[1], name: m[2].trim() });
  }
  const seen = new Set<string>();
  const unique = matches.filter(({ name }) => {
    const key = name.replace(/\s/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.map((u, i) => {
    const start = u.pos;
    const end = i + 1 < unique.length ? unique[i + 1].pos : text.length;
    const rawText = text.slice(start, end);

    const fullNameByNumber = rawText.match(
      /[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}でございます|[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}です[。\n]/
    );
    const firstSpeakerBlock = rawText.match(/○[^\n]+\n(?:[^\n]*\n){0,3}/)?.[0] ?? "";
    const fullNameDirect = firstSpeakerBlock.match(
      /([^\s　。、\n（(]{2,6}(?:でございます|です)[。\n])/
    );
    const fullName = fullNameByNumber
      ? fullNameByNumber[0]
          .replace(/^[0-9０-９]+\s*番[、，\s]/, "")
          .replace(/でございます.*/, "")
          .replace(/です[。\n].*/, "")
          .trim()
      : fullNameDirect
        ? fullNameDirect[1]
            .replace(/でございます.*/, "")
            .replace(/です[。\n].*/, "")
            .trim()
        : memberNameMap.get(parseInt(u.num, 10)) ?? u.name.replace(/\s/g, "");

    return {
      order: i + 1,
      questionerName: u.name.replace(/\s/g, ""),
      questionerNumber: parseInt(u.num, 10) || null,
      fullName,
      rawText,
    };
  });
}

// ─── メイン ──────────────────────────────────────────────────

function main() {
  const [minutesFile, sessionSlug, sessionDayStr] = process.argv.slice(2);
  if (!minutesFile || !sessionSlug || !sessionDayStr) {
    console.error(
      "使い方: tsx akitakata/prepare-gq-prompts.ts <minutes.txt> <session_slug> <session_day>"
    );
    process.exit(1);
  }

  const sessionDay = parseInt(sessionDayStr, 10);
  const outDir = `/tmp/gq-sections/${sessionSlug}-day${sessionDay}`;
  fs.mkdirSync(outDir, { recursive: true });

  const fullText = fs.readFileSync(minutesFile, "utf-8");
  console.log(`📄 読み込み完了: ${fullText.length} chars`);

  // 一般質問の日程番号は定例会ごとに異なる（日程第2 / 日程第5 など）。
  // 議長が「日程第N、…一般質問を行います。」と宣言する行を開始位置とする。
  const gqMatch = fullText.match(
    /^○[^\n]*議\s*長[^\n]*日程第[0-9０-９]+[、，][^\n]*一般質問を行います。/m
  );
  const gqIndex = gqMatch?.index ?? fullText.indexOf("日程第2 一般質問");
  if (gqIndex < 0) {
    console.warn("⚠️ 一般質問の開始位置が見つかりません。全文を対象にします。");
  }
  const gqText = gqIndex >= 0 ? fullText.slice(gqIndex) : fullText;

  const sections = splitByQuestioner(gqText, fullText);
  console.log(`👥 質問者: ${sections.length} 名`);

  const meta = {
    sessionSlug,
    sessionDay,
    questioners: sections.map((s) => ({
      order: s.order,
      questionerName: s.questionerName,
      fullName: s.fullName,
      questionerNumber: s.questionerNumber,
      file: `${String(s.order).padStart(2, "0")}_${s.fullName}.txt`,
      chars: s.rawText.length,
    })),
  };

  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));

  for (const s of sections) {
    const fileName = `${String(s.order).padStart(2, "0")}_${s.fullName}.txt`;
    const cleaned = cleanMinutesText(s.rawText);
    fs.writeFileSync(path.join(outDir, fileName), cleaned);
    console.log(
      `  [${s.order}] ${s.fullName}（${s.questionerName}）: ${s.rawText.length} chars → ${cleaned.length} chars cleaned → ${fileName}`
    );
  }

  console.log(`\n✅ 出力先: ${outDir}`);
  console.log(`   meta.json + ${sections.length} 件のセクションファイル`);
}

main();
