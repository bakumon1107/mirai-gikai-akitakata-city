import "server-only";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { CollectionRun } from "../../shared/types";

const COLLECTIONS_DIR = path.join(process.cwd(), "collections");

async function ensureDir(): Promise<void> {
  await fs.mkdir(COLLECTIONS_DIR, { recursive: true });
}

function runFilePath(runId: string): string {
  return path.join(COLLECTIONS_DIR, `${runId}.json`);
}

export async function saveRun(run: CollectionRun): Promise<void> {
  await ensureDir();
  await fs.writeFile(runFilePath(run.id), JSON.stringify(run, null, 2), "utf8");
}

export async function loadRun(runId: string): Promise<CollectionRun | null> {
  try {
    const content = await fs.readFile(runFilePath(runId), "utf8");
    return JSON.parse(content) as CollectionRun;
  } catch {
    return null;
  }
}

export async function loadAllRuns(): Promise<CollectionRun[]> {
  await ensureDir();
  let files: string[];
  try {
    files = await fs.readdir(COLLECTIONS_DIR);
  } catch {
    return [];
  }

  const runs = await Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .map(async (f) => {
        try {
          const content = await fs.readFile(
            path.join(COLLECTIONS_DIR, f),
            "utf8"
          );
          return JSON.parse(content) as CollectionRun;
        } catch {
          return null;
        }
      })
  );

  return runs
    .filter((r): r is CollectionRun => r !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
