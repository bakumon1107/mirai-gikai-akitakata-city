import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BillsMergePage } from "@/features/bills-merge/client/components/bills-merge-page";
import { routes } from "@/lib/routes";
import { getDuplicateGroups } from "@/features/bills-merge/server/loaders/get-duplicate-groups";

export default async function BillsMergeRoute() {
  const groups = await getDuplicateGroups();

  return (
    <div className="container mx-auto py-8">
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
        <h1 className="text-2xl font-bold text-gray-900">重複議案の統合</h1>
        <p className="text-gray-600 mt-1">
          同じ議案番号の議案をまとめて整理できます（議案番号が0の議案は対象外）
        </p>
      </div>

      <BillsMergePage initialGroups={groups} />
    </div>
  );
}
