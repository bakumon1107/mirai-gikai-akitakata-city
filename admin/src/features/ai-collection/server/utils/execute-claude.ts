import "server-only";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

function resolveClaudePath(): string {
  if (process.env.CLAUDE_CLI_PATH) return process.env.CLAUDE_CLI_PATH;
  if (process.platform === "win32") {
    // Windows: npm グローバルの .cmd ラッパーをフルパスで指定
    const npmGlobal = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "npm",
      "claude.cmd"
    );
    return npmGlobal;
  }
  return "claude";
}

/** Windows の stderr/stdout をデコードする。cp932 (Shift-JIS) で試み、失敗時は UTF-8 */
function decodeBuffer(buf: Buffer): string {
  if (process.platform === "win32") {
    try {
      return new TextDecoder("shift-jis").decode(buf);
    } catch {
      // TextDecoder が対応していない環境では UTF-8 にフォールバック
    }
  }
  return buf.toString("utf8");
}

const CLAUDE_PATH = resolveClaudePath();

/** Claude の使用制限に達したことを示すエラー */
export class ClaudeUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeUsageLimitError";
  }
}

/** Claude の実行がタイムアウトし、出力ファイルが存在しなかった場合のエラー */
export class ClaudeTimeoutError extends Error {
  /** デバッグ用の診断情報（stdout/stderr末尾） */
  readonly diagnostics: string;

  constructor(timeoutSec: number, diagnostics: string) {
    super(`Claude の実行が ${timeoutSec} 秒でタイムアウトしました`);
    this.name = "ClaudeTimeoutError";
    this.diagnostics = diagnostics;
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

/** Claude CLI 実行のタイムアウト（ms）。WebSearch を伴うため長めに設定 */
const CLAUDE_TIMEOUT_MS = 30 * 60 * 1000; // 30分

/** Claude を実行し、結果JSONが書き込まれた一時ファイルのパスを返す */
export function executeClaudeToFile(
  prompt: string,
  _outputFilePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // CLAUDECODE を unset: Claude CLI はネスト起動を検出してブロックするため
    const env = { ...process.env };
    delete env.CLAUDECODE;

    // プロンプトを stdin 経由で渡す（コマンドライン長制限を回避）
    const proc = spawn(
      CLAUDE_PATH,
      [
        "-p",
        "-",
        "--output-format",
        "json",
        "--allowedTools",
        "WebSearch,WebFetch,Write,Read",
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
        env,
        // Windows では claude が .cmd ラッパー経由のため shell: true が必要
        shell: process.platform === "win32",
      }
    );

    // プロンプトを stdin に書き込んで閉じる
    proc.stdin.write(prompt);
    proc.stdin.end();

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    // タイムアウト: プロセスを強制終了し、出力ファイルが存在すれば結果を流用する
    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      // Write ツールが完了していれば出力ファイルが存在する可能性がある
      fs.access(_outputFilePath)
        .then(() => {
          // ファイルが存在 → 結果を流用して resolve
          settle(resolve);
        })
        .catch(() => {
          // ファイルなし → ClaudeTimeoutError で診断情報を保持
          const diagnostics = (stderr + stdout).slice(-500);
          settle(() =>
            reject(
              new ClaudeTimeoutError(CLAUDE_TIMEOUT_MS / 1000, diagnostics)
            )
          );
        });
    }, CLAUDE_TIMEOUT_MS);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += decodeBuffer(chunk);
    });

    proc.on("error", (err) => {
      settle(() =>
        reject(new Error(`claude の起動に失敗しました: ${err.message}`))
      );
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        const combined = stderr + stdout;
        if (isUsageLimitError(combined)) {
          settle(() =>
            reject(
              new ClaudeUsageLimitError(
                `Claude の使用制限に達しました。stderr: ${stderr.slice(0, 300)}`
              )
            )
          );
          return;
        }
        settle(() =>
          reject(
            new Error(
              `claude がコード ${code} で終了しました。stderr: ${stderr.slice(0, 500)}`
            )
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as ClaudeJsonResponse;
        if (parsed.is_error || parsed.subtype === "error") {
          const resultStr = String(parsed.result ?? "不明なエラー");
          if (isUsageLimitError(resultStr)) {
            settle(() =>
              reject(
                new ClaudeUsageLimitError(
                  `Claude の使用制限に達しました: ${resultStr.slice(0, 300)}`
                )
              )
            );
            return;
          }
          settle(() =>
            reject(
              new Error(
                `Claude がエラーを返しました: ${resultStr.slice(0, 300)}`
              )
            )
          );
          return;
        }
      } catch {
        // JSON parse 失敗は無視してファイル読み込みに進む
      }

      settle(resolve);
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
