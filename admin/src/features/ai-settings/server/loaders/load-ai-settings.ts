import "server-only";

import { getAllAiSettings } from "../repositories/ai-settings-repository";

export async function loadAiSettings() {
  const rows = await getAllAiSettings();
  const map = new Map(rows.map((r) => [r.feature_id, r]));
  return map;
}
