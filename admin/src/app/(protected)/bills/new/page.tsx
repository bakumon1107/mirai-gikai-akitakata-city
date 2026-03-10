import { BillCreateForm } from "@/features/bills-edit/client/components/bill-create-form";
import { loadCommittees } from "@/features/committees/server/loaders/load-committees";
import { loadCouncilSessions } from "@/features/council-sessions/server/loaders/load-council-sessions";

export default async function BillCreatePage() {
  const [councilSessions, committees] = await Promise.all([
    loadCouncilSessions(),
    loadCommittees(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">議案新規作成</h1>
      <BillCreateForm
        councilSessions={councilSessions}
        committees={committees}
      />
    </div>
  );
}
