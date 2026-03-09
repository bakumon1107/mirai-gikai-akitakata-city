import "server-only";
import { loadAllRuns, loadRun } from "../utils/storage";
import type { CollectionRun } from "../../shared/types";

export async function getRuns(): Promise<CollectionRun[]> {
  return loadAllRuns();
}

export async function getRun(runId: string): Promise<CollectionRun | null> {
  return loadRun(runId);
}
