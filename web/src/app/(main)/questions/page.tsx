import { notFound, redirect } from "next/navigation";
import { getActiveCouncilSession } from "@/features/council-sessions/server/loaders/get-active-council-session";

export default async function QuestionsPage() {
  const session = await getActiveCouncilSession();

  if (!session) {
    notFound();
  }

  redirect(`/sessions/${session.slug}/questions`);
}
