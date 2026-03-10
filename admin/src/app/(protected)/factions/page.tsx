import { FactionForm } from "@/features/factions/client/components/faction-form";
import { FactionList } from "@/features/factions/client/components/faction-list";
import { loadFactions } from "@/features/factions/server/loaders/load-factions";

export default async function FactionsPage() {
  const factions = await loadFactions();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">会派管理</h1>

      {/* 会派追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">会派を追加</h2>
        <FactionForm />
      </section>

      {/* 会派一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <FactionList factions={factions} />
      </section>
    </div>
  );
}
