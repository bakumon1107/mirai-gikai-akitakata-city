import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";

export async function findAllCouncilSessions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("council_sessions")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw new Error(`定例会の取得に失敗しました: ${error.message}`);
  }

  return data;
}

export async function createCouncilSessionRecord(input: {
  name: string;
  slug: string | null;
  council_url: string | null;
  start_date: string;
  end_date: string | null;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("council_sessions")
    .insert({
      name: input.name,
      slug: input.slug,
      council_url: input.council_url,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`定例会の作成に失敗しました: ${error.message}`);
  }

  return data;
}

export async function updateCouncilSessionRecord(
  id: string,
  input: {
    name: string;
    slug: string | null;
    council_url: string | null;
    start_date: string;
    end_date: string | null;
  }
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("council_sessions")
    .update({
      name: input.name,
      slug: input.slug,
      council_url: input.council_url,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`定例会の更新に失敗しました: ${error.message}`);
  }

  return data;
}

export async function deleteCouncilSessionRecord(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("council_sessions")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`定例会の削除に失敗しました: ${error.message}`);
  }
}

export async function setActiveCouncilSessionRecord(id: string) {
  const supabase = createAdminClient();
  const { error: rpcError } = await supabase.rpc("set_active_council_session", {
    target_session_id: id,
  });

  if (rpcError) {
    throw new Error(
      `アクティブセッションの設定に失敗しました: ${rpcError.message}`
    );
  }
}

export async function findCouncilSessionById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("council_sessions")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`セッション情報の取得に失敗しました: ${error.message}`);
  }

  return data;
}
