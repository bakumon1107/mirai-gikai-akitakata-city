import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type { GeneralQuestion } from "../../shared/types";

export async function findGeneralQuestionsBySession(
  councilSessionId: string
): Promise<GeneralQuestion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select("*")
    .eq("council_session_id", councilSessionId)
    .order("session_day", { ascending: true })
    .order("questioner_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as GeneralQuestion[];
}

export async function findGeneralQuestionById(
  id: string
): Promise<GeneralQuestion | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("general_questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as GeneralQuestion;
}
