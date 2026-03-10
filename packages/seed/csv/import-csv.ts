import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient, clearAllData } from "../shared/helper";

type TableName = keyof Database["public"]["Tables"];

interface CsvImportConfig {
  table: TableName;
  file: string;
}

const CSV_IMPORTS: CsvImportConfig[] = [
  { table: "council_sessions", file: "council_sessions_rows.csv" },
  { table: "committees", file: "committees_rows.csv" },
  { table: "factions", file: "factions_rows.csv" },
  { table: "tags", file: "tags_rows.csv" },
  { table: "bills", file: "bills_rows.csv" },
  { table: "bill_contents", file: "bill_contents_rows.csv" },
  { table: "bills_tags", file: "bills_tags_rows.csv" },
  { table: "faction_stances", file: "faction_stances_rows.csv" },
  { table: "interview_configs", file: "interview_configs_rows.csv" },
  { table: "interview_questions", file: "interview_questions_rows.csv" },
];

/**
 * JSON配列文字列をPostgreSQL配列形式に変換する
 * 例: '["a","b","c"]' -> '{a,b,c}'
 */
function convertJsonArrayToPostgresArray(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const escaped = parsed.map((item) => {
        const str = String(item);
        // カンマ、ダブルクォート、バックスラッシュ、中括弧、空白を含む場合はクォート
        if (/[,"\\\{\}\s]/.test(str)) {
          return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
        }
        return str;
      });
      return `{${escaped.join(",")}}`;
    }
  } catch {
    // JSON解析に失敗した場合は元の値を返す
  }
  return value;
}

function readCsv<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: (value) => {
      if (value === "") return null;
      // JSON配列形式の場合はPostgreSQL配列形式に変換
      if (value.startsWith("[") && value.endsWith("]")) {
        return convertJsonArrayToPostgresArray(value);
      }
      return value;
    },
  });
  return records as T[];
}

async function importFromCsv() {
  const supabase = createAdminClient();
  const dataDir = path.join(import.meta.dirname, "data");

  console.log("🌱 Starting CSV import...");

  try {
    await clearAllData(supabase);

    const summary: Record<string, number> = {};

    for (const config of CSV_IMPORTS) {
      console.log(`Importing ${config.table}...`);

      const csvPath = path.join(dataDir, config.file);
      const records = readCsv<Record<string, unknown>>(csvPath);

      const { data, error } = await supabase
        .from(config.table)
        .insert(records as never[])
        .select();

      if (error) {
        throw new Error(`Failed to import ${config.table}: ${error.message}`);
      }

      const count = data?.length ?? 0;
      summary[config.table] = count;
      console.log(`✅ Imported ${count} ${config.table}`);
    }

    console.log("\n🎉 CSV import completed successfully!");
    console.log("\n📊 Summary:");
    for (const [table, count] of Object.entries(summary)) {
      console.log(`  ${table}: ${count}`);
    }
  } catch (error) {
    console.error("❌ Error importing CSV:", error);
    process.exit(1);
  }
}

importFromCsv();
