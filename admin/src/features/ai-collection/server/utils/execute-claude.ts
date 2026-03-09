import "server-only";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";

const CLAUDE_PATH = "/Users/t-gondo/.local/bin/claude";

/** Claude の使用制限に達したことを示すエラー */
export class ClaudeUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeUsageLimitError";
  }
}

const USAGE_LIMIT_PATTERNS = [
  /usage limit/i,
  /rate limit/i,
  /quota exceeded/i,
  /you have exceeded/i,
  /Claude AI usage limit/i,
  /overloaded/i,
  /Too many requests/i,
];

function isUsageLimitError(text: string): boolean {
  return USAGE_LIMIT_PATTERNS.some((pattern) => pattern.test(text));
}

type ClaudeJsonResponse = {
  result?: string;
  is_error?: boolean;
  subtype?: string;
  [key: string]: unknown;
};

/** Claude を実行し、結果JSONが書き込まれた一時ファイルのパスを返す */
export function executeClaudeToFile(
  prompt: string,
  _outputFilePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // CLAUDECODE を unset: Claude CLI はネスト起動を検出してブロックするため
    const env = { ...process.env };
    delete env.CLAUDECODE;

    const proc = spawn(
      CLAUDE_PATH,
      [
        "-p",
        prompt,
        "--output-format",
        "json",
        "--allowedTools",
        "WebSearch,WebFetch,Write",
      ],
      {
        // stdin を 'ignore' にしないと Claude CLI が入力待ちでブロックする
        stdio: ["ignore", "pipe", "pipe"],
        env,
      }
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      reject(new Error(`claude の起動に失敗しました: ${err.message}`));
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        const combined = stderr + stdout;
        if (isUsageLimitError(combined)) {
          reject(
            new ClaudeUsageLimitError(
              `Claude の使用制限に達しました。stderr: ${stderr.slice(0, 300)}`
            )
          );
          return;
        }
        reject(
          new Error(
            `claude がコード ${code} で終了しました。stderr: ${stderr.slice(0, 500)}`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ClaudeJsonResponse;
        if (parsed.is_error || parsed.subtype === "error") {
          const resultStr = String(parsed.result ?? "不明なエラー");
          if (isUsageLimitError(resultStr)) {
            reject(
              new ClaudeUsageLimitError(
                `Claude の使用制限に達しました: ${resultStr.slice(0, 300)}`
              )
            );
            return;
          }
          reject(
            new Error(`Claude がエラーを返しました: ${resultStr.slice(0, 300)}`)
          );
          return;
        }
      } catch {
        // JSON parse 失敗は無視してファイル読み込みに進む
      }

      resolve();
    });
  });
}

export function getTempOutputPath(runId: string): string {
  return path.join(os.tmpdir(), `kawasaki_collection_${runId}.json`);
}

export async function readCollectionOutput(
  outputFilePath: string
): Promise<string> {
  try {
    return await fs.readFile(outputFilePath, "utf8");
  } catch {
    throw new Error(
      `Claude が結果ファイルを書き込みませんでした: ${outputFilePath}`
    );
  }
}

export async function cleanupTempFile(outputFilePath: string): Promise<void> {
  try {
    await fs.unlink(outputFilePath);
  } catch {
    // 削除失敗は無視
  }
}

type ClaudeCollectionResult = {
  bills: Array<{
    billNumber?: string | null;
    title: string;
    summary: string;
    status: string;
    submitter?: string | null;
    sourceUrls?: string[];
  }>;
  factionStances: Array<{
    billTitle: string;
    factionName: string;
    stanceType: string;
    comment?: string | null;
    sourceUrls?: string[];
  }>;
  sources: string[];
};

export function parseClaudeResult(rawResult: string): ClaudeCollectionResult {
  // Extract JSON from result (Claude may return text with JSON embedded)
  const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude の出力からJSONを抽出できませんでした");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ClaudeCollectionResult;

  return {
    bills: Array.isArray(parsed.bills) ? parsed.bills : [],
    factionStances: Array.isArray(parsed.factionStances)
      ? parsed.factionStances
      : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}
