export type IssueCard = {
  title: string;
  body: string;
  opinionCount: number;
  tags: string[];
};

export type ConsultationMeeting = {
  id: string;
  locationName: string;
  heldAt: string | null;
  participantCount: number | null;
  theme: string | null;
  aiRepresentativeQuote: string | null;
};

export type ConsultationOpinion = {
  id: string;
  department: string;
  opinionNumber: number | null;
  tags: string[];
  opinionType: "demand" | "proposal" | "complaint" | "question" | null;
  aiSummary: string | null;
  text: string;
};

export type DepartmentStat = {
  name: string;
  count: number;
};

export type CommunityConsultation = {
  id: string;
  fiscalYear: string;
  fiscalYearLabel: string;
  title: string;
  pdfUrl: string | null;
  status: string;
  heldFrom: string | null;
  heldTo: string | null;
  totalParticipants: number | null;
  totalOpinions: number | null;
  aiYearSummary: string | null;
  aiIssueCards: IssueCard[];
  meetings: ConsultationMeeting[];
};

export type CommunityConsultationListItem = {
  id: string;
  fiscalYear: string;
  fiscalYearLabel: string;
  title: string;
  heldFrom: string | null;
  heldTo: string | null;
  totalParticipants: number | null;
  totalOpinions: number | null;
  aiYearSummary: string | null;
  meetingCount: number;
};
