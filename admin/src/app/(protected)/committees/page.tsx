import { CommitteeForm } from "@/features/committees/client/components/committee-form";
import { CommitteeList } from "@/features/committees/client/components/committee-list";
import { loadCommittees } from "@/features/committees/server/loaders/load-committees";

export default async function CommitteesPage() {
  const committees = await loadCommittees();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">委員会管理</h1>

      {/* 委員会追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">委員会を追加</h2>
        <CommitteeForm />
      </section>

      {/* 委員会一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <CommitteeList committees={committees} />
      </section>
    </div>
  );
}
