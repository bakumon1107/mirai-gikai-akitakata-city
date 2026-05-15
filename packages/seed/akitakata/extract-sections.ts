import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMinutes } from "./parse-minutes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const minutesDir = path.resolve(__dirname, "../../../docs/akitakata/minutes");
const outDir = path.join(minutesDir, "sections");
fs.mkdirSync(outDir, { recursive: true });

function toHalf(s: string) {
  return s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10));
}

function buildMemberNameMap(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const startIdx = text.indexOf("出席議員は次のとおりである");
  if (startIdx < 0) return map;
  const sectionText = text.slice(startIdx, startIdx + 1000);
  const ENTRY_RE = /([０-９]{1,2})番[ 　]{1,8}((?:[^\s０-９\d\n]+[ 　]*){1,4})/g;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_RE.exec(sectionText)) !== null) {
    const num = parseInt(toHalf(m[1]), 10);
    const name = m[2].replace(/\s/g, "").trim();
    if (!isNaN(num) && name.length >= 2 && name.length <= 8) map.set(num, name);
  }
  return map;
}

function splitByQuestioner(text: string, fullText: string) {
  const memberNameMap = buildMemberNameMap(fullText);
  const SECTION_START_RE = /([0-9０-９]+)\s*番[、，\s]([^\n。]{1,10}?)議員[。\n]/g;
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
  return unique.map(({ pos, num, name }, i) => {
    const end = i + 1 < unique.length ? unique[i + 1].pos : text.length;
    const rawText = text.slice(pos, end);
    const fullNameByNumber = rawText.match(
      /[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}でございます|[0-9０-９]+\s*番[、，\s][^\nの。]{2,15}です[。\n]/
    );
    const firstSpeakerBlock = rawText.match(/○[^\n]+\n(?:[^\n]*\n){0,3}/)?.[0] ?? "";
    const fullNameDirect = firstSpeakerBlock.match(/([^\s　。、\n（(]{2,6}(?:でございます|です)[。\n])/);
    const fullName = fullNameByNumber
      ? fullNameByNumber[0].replace(/^[0-9０-９]+\s*番[、，\s]/, "").replace(/でございます.*/, "").replace(/です[。\n].*/, "").trim()
      : fullNameDirect
        ? fullNameDirect[1].replace(/でございます.*/, "").replace(/です[。\n].*/, "").trim()
        : memberNameMap.get(parseInt(num, 10)) ?? name.replace(/\s/g, "");
    return { num: parseInt(num, 10), name: name.replace(/\s/g, ""), fullName, rawText };
  });
}

for (const [day, file] of [
  ["day1", path.join(minutesDir, "r8-1-day1.txt")],
  ["day2", path.join(minutesDir, "r8-1-day2.txt")],
]) {
  const fullText = fs.readFileSync(file, "utf-8");
  const gqIndex = fullText.indexOf("日程第2 一般質問");
  const gqText = gqIndex >= 0 ? fullText.slice(gqIndex) : fullText;
  const sections = splitByQuestioner(gqText, fullText);
  for (const s of sections) {
    const fname = `r8-1-${day}-${String(s.num).padStart(2, "0")}-${s.fullName}.txt`;
    fs.writeFileSync(path.join(outDir, fname), s.rawText, "utf-8");
    console.log(`✅ ${fname} (${s.rawText.length}文字)`);
  }
}
