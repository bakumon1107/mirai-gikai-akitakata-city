import type { CouncilSession } from "../../shared/types";
import { findAllCouncilSessions } from "../repositories/council-session-repository";

export async function loadCouncilSessions(): Promise<CouncilSession[]> {
  const data = await findAllCouncilSessions();
  return data || [];
}
