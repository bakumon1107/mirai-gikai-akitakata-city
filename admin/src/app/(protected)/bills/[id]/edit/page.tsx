import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { routes } from "@/lib/routes";
import { BillEditForm } from "@/features/bills-edit/client/components/bill-edit-form";
import { BillTagsForm } from "@/features/bills-edit/client/components/bill-tags-form";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { getBillTagIds } from "@/features/bills-edit/server/loaders/get-bill-tag-ids";
import { loadCommittees } from "@/features/committees/server/loaders/load-committees";
import { loadCouncilSessions } from "@/features/council-sessions/server/loaders/load-council-sessions";
import { StancesManager } from "@/features/faction-stances/client/components/stances-manager";
import { getFactions } from "@/features/faction-stances/server/loaders/get-factions";
import { getStancesByBillId } from "@/features/faction-stances/server/loaders/get-stances-by-bill-id";
import { loadTags } from "@/features/tags/server/loaders/load-tags";

interface BillEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillEditPage({ params }: BillEditPageProps) {
  const { id } = await params;
  const [
    bill,
    stances,
    factions,
    allTags,
    selectedTagIds,
    councilSessions,
    committees,
  ] = await Promise.all([
    getBillById(id),
    getStancesByBillId(id),
    getFactions(),
    loadTags(),
    getBillTagIds(id),
    loadCouncilSessions(),
    loadCommittees(),
  ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.bills()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          議案一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">議案編集</h1>
        <p className="text-gray-600 mt-1">議案の基本情報を編集します</p>
      </div>

      <div className="space-y-6">
        <BillEditForm
          bill={bill}
          councilSessions={councilSessions}
          committees={committees}
        />
        <StancesManager
          billId={bill.id}
          billStatus={bill.status}
          factions={factions}
          stances={stances}
        />
        <BillTagsForm
          billId={bill.id}
          allTags={allTags}
          selectedTagIds={selectedTagIds}
        />
      </div>
    </div>
  );
}
