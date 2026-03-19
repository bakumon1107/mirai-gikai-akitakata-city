import type {
  BillSortConfig,
  BillWithCouncilSession,
} from "../../shared/types";
import { findBillsWithCouncilSessions } from "../repositories/bill-repository";

export type BillListFilters = {
  sessionId?: string;
  tagId?: string;
  publishStatus?: string;
  reviewStatus?: string;
  isFeatured?: string;
};

export async function getBills(
  sortConfig?: BillSortConfig,
  filters?: BillListFilters
): Promise<BillWithCouncilSession[]> {
  const data = await findBillsWithCouncilSessions(sortConfig, filters);
  return data || [];
}
