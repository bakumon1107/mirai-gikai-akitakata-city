"use client";

import { GitMerge, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeBills } from "../../server/actions/merge-bills";
import type { DuplicateGroup } from "../../server/loaders/get-duplicate-groups";

const PUBLISH_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  coming_soon: "Coming Soon",
  published: "公開中",
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "提出",
  in_committee: "委員会審査",
  plenary_session: "本会議",
  approved: "可決",
  rejected: "否決",
};

type GroupCardProps = {
  group: DuplicateGroup;
  onMerged: () => void;
};

function GroupCard({ group, onMerged }: GroupCardProps) {
  const [primaryId, setPrimaryId] = useState<string>(group.bills[0].id);
  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    const duplicateIds = group.bills
      .filter((b) => b.id !== primaryId)
      .map((b) => b.id);

    if (duplicateIds.length === 0) {
      toast.error("統合対象がありません");
      return;
    }

    setIsMerging(true);
    try {
      const result = await mergeBills({ primaryId, duplicateIds });

      if (!result.success) {
        toast.error(result.error ?? "統合に失敗しました");
        return;
      }

      toast.success(
        `「${group.name}」の重複${result.mergedCount}件を統合しました`
      );

      if (result.warnings.length > 0) {
        for (const w of result.warnings) {
          toast.warning(w);
        }
      }

      onMerged();
    } catch (err) {
      console.error("Merge error:", err);
      toast.error("統合中にエラーが発生しました");
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
        <p className="text-sm text-gray-500">{group.bills.length}件の重複</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="w-10 px-3 py-2 text-center">保持</th>
                <th className="px-3 py-2 text-left">公開状態</th>
                <th className="px-3 py-2 text-left">審議状態</th>
                <th className="px-3 py-2 text-left">コンテンツ</th>
                <th className="px-3 py-2 text-left">会派見解</th>
                <th className="px-3 py-2 text-left">作成日時</th>
              </tr>
            </thead>
            <tbody>
              {group.bills.map((bill) => {
                const isPrimary = bill.id === primaryId;
                return (
                  <tr
                    key={bill.id}
                    className={`border-b last:border-0 cursor-pointer ${
                      isPrimary ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setPrimaryId(bill.id)}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="radio"
                        checked={isPrimary}
                        onChange={() => setPrimaryId(bill.id)}
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          bill.publish_status === "published"
                            ? "default"
                            : "outline"
                        }
                      >
                        {PUBLISH_STATUS_LABELS[bill.publish_status] ??
                          bill.publish_status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">
                        {STATUS_LABELS[bill.status] ?? bill.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {bill.contentsCount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {bill.contentsCount}件
                        </span>
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {bill.stancesCount > 0 ? (
                        <span className="text-green-600 font-medium">
                          {bill.stancesCount}件
                        </span>
                      ) : (
                        <span className="text-gray-400">なし</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">
                      {new Date(bill.created_at).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleMerge}
            disabled={isMerging}
            variant="outline"
            size="sm"
          >
            {isMerging ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GitMerge className="mr-2 h-4 w-4" />
            )}
            ラジオボタン選択の議案に統合（他を削除）
          </Button>
          <p className="text-xs text-gray-500">
            コンテンツ・会派見解は保持する議案に未設定分のみ移行されます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

type BillsMergePageProps = {
  initialGroups: DuplicateGroup[];
};

export function BillsMergePage({ initialGroups }: BillsMergePageProps) {
  const [groups, setGroups] = useState(initialGroups);

  const handleMerged = (mergedName: string) => {
    // Remove merged group (or reload; here we just filter it out optimistically)
    setGroups((prev) => prev.filter((g) => g.name !== mergedName));
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        重複している議案はありません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        同じ名前の議案が{groups.length}グループ見つかりました。
        各グループで「保持」する議案をラジオボタンで選択し、統合を実行してください。
        他の議案のコンテンツ・会派見解は保持する議案に（未設定分のみ）移行後、削除されます。
      </p>

      {groups.map((group) => (
        <GroupCard
          key={group.name}
          group={group}
          onMerged={() => handleMerged(group.name)}
        />
      ))}
    </div>
  );
}
