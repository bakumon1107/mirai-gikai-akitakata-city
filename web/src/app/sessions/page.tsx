import type { Metadata } from "next";
import { Container } from "@/components/layouts/container";
import { siteConfig } from "@/config/site.config";
import { SessionList } from "@/features/council-sessions/server/components/session-list";
import { getAllPastSessions } from "@/features/council-sessions/server/loaders/get-all-past-sessions";

export const metadata: Metadata = {
  title: `過去の議会一覧 | ${siteConfig.siteName}`,
  description: "過去に開催された定例会の一覧です。",
};

export default async function SessionsPage() {
  const sessions = await getAllPastSessions();

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-mirai-text">過去の議会一覧</h1>
        <p className="mt-2 text-sm text-mirai-text-muted">
          過去に開催された定例会とその議案をご覧いただけます。
        </p>
      </div>

      <SessionList sessions={sessions} />
    </Container>
  );
}
