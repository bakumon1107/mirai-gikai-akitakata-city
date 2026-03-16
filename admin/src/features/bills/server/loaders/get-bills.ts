import type {
  BillSortConfig,
  BillWithCouncilSession,
} from "../../shared/types";
import { findBillsWithCouncilSessions } from "../repositories/bill-repository";

export async function getBills(
  sortConfig?: BillSortConfig,
  sessionId?: string
): Promise<BillWithCouncilSession[]> {
  const data = await findBillsWithCouncilSessions(sortConfig, sessionId);
  return data || [];
}
