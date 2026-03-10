import { CouncilSessionForm } from "@/features/council-sessions/client/components/council-session-form";
import { CouncilSessionList } from "@/features/council-sessions/client/components/council-session-list";
import { loadCouncilSessions } from "@/features/council-sessions/server/loaders/load-council-sessions";

export default async function CouncilSessionsPage() {
  const sessions = await loadCouncilSessions();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">定例会管理</h1>

      {/* 定例会追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">定例会を追加</h2>
        <CouncilSessionForm />
      </section>

      {/* 定例会一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <CouncilSessionList sessions={sessions} />
      </section>
    </div>
  );
}
