import "server-only";
import type { Database } from "@mirai-gikai/supabase";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  BillInsert,
  BillPublishStatus,
  BillSortConfig,
} from "../../shared/types";

type BillContentInsert =
  Database["public"]["Tables"]["bill_contents"]["Insert"];

type BillFilters = {
  sessionId?: string;
  tagId?: string;
  publishStatus?: string;
  reviewStatus?: string;
  isFeatured?: string;
};

export async function findBillsWithCouncilSessions(
  sortConfig?: BillSortConfig,
  filters?: BillFilters
) {
  const supabase = createAdminClient();
  const field = sortConfig?.field ?? "created_at";
  const ascending = (sortConfig?.order ?? "desc") === "asc";

  const orderOptions: { ascending: boolean; nullsFirst?: boolean } = {
    ascending,
  };

  if (field === "published_at") {
    orderOptions.nullsFirst = false;
  }

  let query = supabase.from("bills").select("*, council_sessions(name)");

  if (filters?.sessionId) {
    query = query.eq("council_session_id", filters.sessionId);
  }

  if (filters?.publishStatus) {
    query = query.eq(
      "publish_status",
      filters.publishStatus as "draft" | "published" | "coming_soon"
    );
  }

  if (filters?.reviewStatus) {
    query = query.eq(
      "status",
      filters.reviewStatus as
        | "preparing"
        | "submitted"
        | "in_committee"
        | "plenary_session"
        | "approved"
        | "rejected"
    );
  }

  if (filters?.tagId) {
    const { data: taggedBills } = await supabase
      .from("bills_tags")
      .select("bill_id")
      .eq("tag_id", filters.tagId);
    const billIds = (taggedBills ?? []).map((b) => b.bill_id);
    query = query.in("id", billIds);
  }

  if (filters?.isFeatured !== undefined && filters.isFeatured !== "") {
    query = query.eq("is_featured", filters.isFeatured === "true");
  }

  const result =
    field === "council_session"
      ? await query.order("created_at", {
          referencedTable: "council_sessions",
          ascending,
        })
      : await query.order(field, orderOptions);

  const { data, error } = result;

  if (error) {
    throw new Error(`Failed to fetch bills: ${error.message}`);
  }
  return data;
}

export async function findBillById(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }
  return data;
}

export async function createBill(insertData: BillInsert) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .insert(insertData)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create bill: ${error.message}`);
  }
  return data;
}

export async function deleteBillById(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("bills").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete bill: ${error.message}`);
  }
}

export async function updateBillPublishStatus(
  billId: string,
  publishStatus: BillPublishStatus
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("bills")
    .update({ publish_status: publishStatus })
    .eq("id", billId);

  if (error) {
    throw new Error(`Failed to update bill publish status: ${error.message}`);
  }
}

export async function findBillContentsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bill_contents")
    .select("*")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill contents: ${error.message}`);
  }
  return data;
}

export async function createBillContents(contents: BillContentInsert[]) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("bill_contents").insert(contents);

  if (error) {
    throw new Error(`Failed to create bill contents: ${error.message}`);
  }
}

export async function findBillTagIdsByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills_tags")
    .select("tag_id")
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to fetch bill tag ids: ${error.message}`);
  }

  return data?.map((item) => item.tag_id) ?? [];
}

export async function createBillsTags(billId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  const billTags = tagIds.map((tagId) => ({
    bill_id: billId,
    tag_id: tagId,
  }));

  const { error } = await supabase.from("bills_tags").insert(billTags);

  if (error) {
    throw new Error(`Failed to create bill tags: ${error.message}`);
  }
}

export async function findPreviewToken(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("preview_tokens")
    .select("token, expires_at")
    .eq("bill_id", billId)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

export async function createPreviewToken(params: {
  billId: string;
  token: string;
  expiresAt: string;
  createdBy: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("preview_tokens").insert({
    bill_id: params.billId,
    token: params.token,
    expires_at: params.expiresAt,
    created_by: params.createdBy,
  });

  if (error) {
    throw new Error(`Failed to insert preview token: ${error.message}`);
  }
}

export async function deletePreviewTokenByBillId(billId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preview_tokens")
    .delete()
    .eq("bill_id", billId);

  if (error) {
    throw new Error(`Failed to delete preview token: ${error.message}`);
  }
}

export async function findPreviewTokenForValidation(
  billId: string,
  token: string
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("preview_tokens")
    .select("expires_at")
    .eq("bill_id", billId)
    .eq("token", token)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}
