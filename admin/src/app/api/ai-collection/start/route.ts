import { NextResponse } from "next/server";
import { buildPrompt } from "@/features/ai-collection/server/utils/build-prompt";
import { getExistingBillNumbers } from "@/features/ai-collection/server/loaders/get-existing-bill-names";
import {
  ClaudeUsageLimitError,
  cleanupTempFile,
  executeClaudeToFile,
  getTempOutputPath,
  readCollectionOutput,
} from "@/features/ai-collection/server/utils/execute-claude";
import { collectWithOpenAi } from "@/features/ai-collection/server/services/collect-with-openai";
import { getAiModel } from "@/features/ai-settings/server/loaders/get-ai-model";
import { isClaudeCliModel } from "@/features/ai-settings/shared/ai-model-options";
import {
  loadRun,
  saveRun,
} from "@/features/ai-collection/server/utils/storage";
import type {
  CollectionRun,
  DraftBill,
  DraftFactionStance,
} from "@/features/ai-collection/shared/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      startDate?: string;
      endDate?: string;
    };
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate と endDate は必須です" },
        { status: 400 }
      );
    }

    const runId = crypto.randomUUID();
    const now = new Date().toISOString();

    const initialRun: CollectionRun = {
      id: runId,
      startDate,
      endDate,
      status: "running",
      createdAt: now,
      completedAt: null,
      error: null,
      bills: [],
      factionStances: [],
      sources: [],
    };

    await saveRun(initialRun);

    const modelId = await getAiModel("ai-collection", "anthropic/claude-cli");

    const existingBillNumbers = await getExistingBillNumbers();

    if (isClaudeCliModel(modelId)) {
      // Claude CLI で実行
      runClaudeInBackground(runId, startDate, endDate, existingBillNumbers);
    } else {
      // OpenAI API で実行
      runOpenAiInBackground(
        runId,
        modelId,
        startDate,
        endDate,
        existingBillNumbers
      );
    }

    return NextResponse.json({ runId });
  } catch (error) {
    console.error("AI collection start error:", error);
    return NextResponse.json(
      { error: "収集の開始に失敗しました" },
      { status: 500 }
    );
  }
}

async function runClaudeInBackground(
  runId: string,
  startDate: string,
  endDate: string,
  existingBillNumbers: string[]
): Promise<void> {
  const outputFilePath = getTempOutputPath(runId);

  try {
    const prompt = buildPrompt(
      startDate,
      endDate,
      outputFilePath,
      existingBillNumbers
    );

    // Claude を実行し、結果を outputFilePath に書き込ませる
    await executeClaudeToFile(prompt, outputFilePath);

    // Claude が書き込んだファイルを読み込む
    const rawJson = await readCollectionOutput(outputFilePath);
    const parsed = parseCollectionJson(rawJson);

    const run = await loadRun(runId);
    if (!run) return;

    const bills: DraftBill[] = parsed.bills.map((b) => ({
      id: crypto.randomUUID(),
      billNumber: b.billNumber ?? null,
      title: b.title,
      summary: b.summary,
      status: b.status as DraftBill["status"],
      statusNote: b.statusNote ?? null,
      submitter: b.submitter ?? null,
      sourceUrls: b.sourceUrls ?? [],
    }));

    const factionStances: DraftFactionStance[] = parsed.factionStances.map(
      (s) => ({
        id: crypto.randomUUID(),
        billTitle: s.billTitle,
        factionName: s.factionName,
        stanceType: s.stanceType as DraftFactionStance["stanceType"],
        comment: s.comment ?? null,
        sourceUrls: s.sourceUrls ?? [],
      })
    );

    const updatedRun: CollectionRun = {
      ...run,
      status: "completed",
      completedAt: new Date().toISOString(),
      bills,
      factionStances,
      sources: parsed.sources,
    };

    await saveRun(updatedRun);
  } catch (error) {
    const run = await loadRun(runId);
    if (!run) return;

    if (error instanceof ClaudeUsageLimitError) {
      const updatedRun: CollectionRun = {
        ...run,
        status: "paused",
        error: "Claude制限に達した為、一時停止しています",
      };
      await saveRun(updatedRun);
    } else {
      const updatedRun: CollectionRun = {
        ...run,
        status: "failed",
        completedAt: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
      };
      await saveRun(updatedRun);
    }
  } finally {
    await cleanupTempFile(outputFilePath);
  }
}

type RawCollectionResult = {
  bills: Array<{
    billNumber?: string | null;
    title: string;
    summary: string;
    status: string;
    statusNote?: string | null;
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

async function runOpenAiInBackground(
  runId: string,
  modelId: string,
  startDate: string,
  endDate: string,
  existingBillNumbers: string[]
): Promise<void> {
  try {
    const parsed = await collectWithOpenAi(
      modelId,
      startDate,
      endDate,
      existingBillNumbers
    );

    const run = await loadRun(runId);
    if (!run) return;

    const bills: DraftBill[] = parsed.bills.map((b) => ({
      id: crypto.randomUUID(),
      billNumber: b.billNumber ?? null,
      title: b.title,
      summary: b.summary,
      status: b.status as DraftBill["status"],
      statusNote: b.statusNote ?? null,
      submitter: b.submitter ?? null,
      sourceUrls: b.sourceUrls ?? [],
    }));

    const factionStances: DraftFactionStance[] = parsed.factionStances.map(
      (s) => ({
        id: crypto.randomUUID(),
        billTitle: s.billTitle,
        factionName: s.factionName,
        stanceType: s.stanceType as DraftFactionStance["stanceType"],
        comment: s.comment ?? null,
        sourceUrls: s.sourceUrls ?? [],
      })
    );

    const updatedRun: CollectionRun = {
      ...run,
      status: "completed",
      completedAt: new Date().toISOString(),
      bills,
      factionStances,
      sources: parsed.sources,
    };

    await saveRun(updatedRun);
  } catch (error) {
    const run = await loadRun(runId);
    if (!run) return;

    const updatedRun: CollectionRun = {
      ...run,
      status: "failed",
      completedAt: new Date().toISOString(),
      error:
        error instanceof Error ? error.message : "不明なエラーが発生しました",
    };
    await saveRun(updatedRun);
  }
}

function parseCollectionJson(raw: string): RawCollectionResult {
  // マークダウンコードブロックや前後のテキストを除去してJSONを抽出
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `ファイルからJSONを抽出できませんでした。内容: ${raw.slice(0, 200)}`
    );
  }

  const parsed = JSON.parse(jsonMatch[0]) as RawCollectionResult;

  return {
    bills: Array.isArray(parsed.bills) ? parsed.bills : [],
    factionStances: Array.isArray(parsed.factionStances)
      ? parsed.factionStances
      : [],
    sources: Array.isArray(parsed.sources) ? parsed.sources : [],
  };
}
