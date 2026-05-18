import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  CommunityConsultation,
  CommunityConsultationListItem,
  ConsultationMeeting,
  ConsultationOpinion,
  IssueCard,
} from "../../shared/types";

type MeetingRow = {
  id: string;
  location_name: string;
  held_at: string | null;
  participant_count: number | null;
  theme: string | null;
  ai_representative_quote: string | null;
};

type ConsultationRow = {
  id: string;
  fiscal_year: string;
  fiscal_year_label: string;
  title: string;
  pdf_url: string | null;
  status: string;
  held_from: string | null;
  held_to: string | null;
  total_participants: number | null;
  total_opinions: number | null;
  ai_year_summary: string | null;
  ai_issue_cards: unknown;
  community_consultation_meetings: MeetingRow[];
};

function mapMeeting(row: MeetingRow): ConsultationMeeting {
  return {
    id: row.id,
    locationName: row.location_name,
    heldAt: row.held_at,
    participantCount: row.participant_count,
    theme: row.theme,
    aiRepresentativeQuote: row.ai_representative_quote,
  };
}

function mapToConsultation(row: ConsultationRow): CommunityConsultation {
  const rawCards = Array.isArray(row.ai_issue_cards) ? row.ai_issue_cards : [];
  return {
    id: row.id,
    fiscalYear: row.fiscal_year,
    fiscalYearLabel: row.fiscal_year_label,
    title: row.title,
    pdfUrl: row.pdf_url,
    status: row.status,
    heldFrom: row.held_from,
    heldTo: row.held_to,
    totalParticipants: row.total_participants,
    totalOpinions: row.total_opinions,
    aiYearSummary: row.ai_year_summary,
    aiIssueCards: rawCards as IssueCard[],
    meetings: [...(row.community_consultation_meetings ?? [])].map(mapMeeting),
  };
}

const DETAIL_SELECT = `
  *,
  community_consultation_meetings (*)
` as const;

export async function findPublishedConsultations(): Promise<
  CommunityConsultationListItem[]
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_consultations")
    .select(
      "id, fiscal_year, fiscal_year_label, title, held_from, held_to, total_participants, total_opinions, ai_year_summary, community_consultation_meetings(id)"
    )
    .eq("status", "published")
    .order("held_from", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch consultations: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    fiscalYear: row.fiscal_year,
    fiscalYearLabel: row.fiscal_year_label,
    title: row.title,
    heldFrom: row.held_from,
    heldTo: row.held_to,
    totalParticipants: row.total_participants,
    totalOpinions: row.total_opinions,
    aiYearSummary: row.ai_year_summary,
    meetingCount:
      (row.community_consultation_meetings as { id: string }[])?.length ?? 0,
  }));
}

export async function findLatestPublishedConsultation(): Promise<CommunityConsultation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_consultations")
    .select(DETAIL_SELECT)
    .eq("status", "published")
    .order("held_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest consultation: ${error.message}`);
  }

  return data ? mapToConsultation(data as unknown as ConsultationRow) : null;
}

export async function findConsultationByFiscalYear(
  fiscalYear: string
): Promise<CommunityConsultation | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_consultations")
    .select(DETAIL_SELECT)
    .eq("fiscal_year", fiscalYear)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch consultation: ${error.message}`);
  }

  return data ? mapToConsultation(data as unknown as ConsultationRow) : null;
}

export async function findOpinionsByConsultationId(
  consultationId: string
): Promise<ConsultationOpinion[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("community_consultation_opinions")
    .select("*, community_consultation_opinion_tags(tag)")
    .eq("consultation_id", consultationId)
    .order("opinion_number", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch opinions: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    department: row.department,
    opinionNumber: row.opinion_number,
    tags: (row.community_consultation_opinion_tags as { tag: string }[]).map(
      (t) => t.tag
    ),
    opinionType: row.opinion_type as ConsultationOpinion["opinionType"],
    aiSummary: row.ai_summary,
    text: row.text,
  }));
}
