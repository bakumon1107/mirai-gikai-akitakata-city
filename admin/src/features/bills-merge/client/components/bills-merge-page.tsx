"use client";

import type { Database } from "@mirai-gikai/supabase";
import { GitMerge, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeBills } from "../../server/actions/merge-bills";
import type {
  BillInGroup,
  DuplicateGroup,
} from "../../server/loaders/get-duplicate-groups";

// ---- ラベル定義 ----

const PUBLISH_STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  coming_soon: "Coming Soon",
  published: "公開中",
};

const STATUS_LABELS: Record<string, string> = {
  preparing: "上程前",
  submitted: "上程済み",
  in_committee: "委員会審査",
  plenary_session: "本会議",
  approved: "可決",
  rejected: "否決",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  normal: "普通",
  hard: "詳しく",
};

const STANCE_TYPE_LABELS: Record<string, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
};

// ---- スカラーフィールド定義 ----

type ScalarField = {
  key: string;
  label: string;
  format: (bill: BillInGroup) => string;
};

const SCALAR_FIELDS: ScalarField[] = [
  { key: "name", label: "議案名", format: (b) => b.name },
  {
    key: "status",
    label: "審議ステータス",
    format: (b) => STATUS_LABELS[b.status] ?? b.status,
  },
  {
    key: "status_note",
    label: "ステータス備考",
    format: (b) => b.status_note || "(なし)",
  },
  {
    key: "publish_status",
    label: "公開ステータス",
    format: (b) => PUBLISH_STATUS_LABELS[b.publish_status] ?? b.publish_status,
  },
  {
    key: "published_at",
    label: "公開日時",
    format: (b) =>
      b.published_at
        ? new Date(b.published_at).toLocaleDateString("ja-JP", {
            timeZone: "Asia/Tokyo",
          })
        : "(未設定)",
  },
  {
    key: "is_featured",
    label: "注目の議案",
    format: (b) => (b.is_featured ? "注目" : "通常"),
  },
  {
    key: "committee_id",
    label: "委員会",
    format: (b) => (b.committee_id ? "設定あり" : "(未設定)"),
  },
  {
    key: "council_session_id",
    label: "定例会",
    format: (b) => (b.council_session_id ? "設定あり" : "(未設定)"),
  },
  {
    key: "thumbnail_url",
    label: "サムネイル",
    format: (b) => (b.thumbnail_url ? "設定あり" : "(なし)"),
  },
  {
    key: "share_thumbnail_url",
    label: "シェア用OGP",
    format: (b) => (b.share_thumbnail_url ? "設定あり" : "(なし)"),
  },
];

// ---- ラジオセル ----

function RadioCell({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <td
      className={`px-3 py-2 cursor-pointer ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
      onClick={() => onChange(value)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChange(value)}
    >
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          className="mt-0.5 accent-blue-600 shrink-0"
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-sm">{children}</span>
      </label>
    </td>
  );
}

// ---- GroupCard ----

type GroupCardProps = {
  group: DuplicateGroup;
  onMerged: () => void;
};

function GroupCard({ group, onMerged }: GroupCardProps) {
  const bills = group.bills;

  // スカラーフィールド: fieldKey -> 選択中のbillId
  const [fieldChoices, setFieldChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(SCALAR_FIELDS.map((f) => [f.key, bills[0].id]))
  );

  // コンテンツ: difficultyLevel -> 選択中のcontentId
  const allDifficulties = [
    ...new Set(bills.flatMap((b) => b.contents.map((c) => c.difficulty_level))),
  ];
  const [contentChoices, setContentChoices] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const dl of allDifficulties) {
        for (const bill of bills) {
          const content = bill.contents.find((c) => c.difficulty_level === dl);
          if (content) {
            initial[dl] = content.id;
            break;
          }
        }
      }
      return initial;
    }
  );

  // 会派見解: factionId -> 選択中のstanceId
  const allFactionIds = [
    ...new Set(bills.flatMap((b) => b.stances.map((s) => s.faction_id))),
  ];
  const [stanceChoices, setStanceChoices] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const factionId of allFactionIds) {
        for (const bill of bills) {
          const stance = bill.stances.find((s) => s.faction_id === factionId);
          if (stance) {
            initial[factionId] = stance.id;
            break;
          }
        }
      }
      return initial;
    }
  );

  const [isMerging, setIsMerging] = useState(false);

  const handleMerge = async () => {
    const keepBill = bills[0];
    const deleteBillIds = bills.slice(1).map((b) => b.id);

    // スカラーフィールドの値を選択済みbillから収集
    const getField = <K extends keyof BillInGroup>(key: K): BillInGroup[K] =>
      (bills.find((b) => b.id === fieldChoices[key]) ?? keepBill)[key];

    const billUpdate = {
      name: getField("name") as string,
      status: getField(
        "status"
      ) as Database["public"]["Enums"]["bill_status_enum"],
      status_note: getField("status_note") as string | null,
      publish_status: getField(
        "publish_status"
      ) as Database["public"]["Enums"]["bill_publish_status"],
      published_at: getField("published_at") as string | null,
      thumbnail_url: getField("thumbnail_url") as string | null,
      share_thumbnail_url: getField("share_thumbnail_url") as string | null,
      is_featured: getField("is_featured") as boolean,
      committee_id: getField("committee_id") as string | null,
      council_session_id: getField("council_session_id") as string | null,
    };

    const contentSelections = Object.entries(contentChoices).map(
      ([difficultyLevel, contentId]) => ({ contentId, difficultyLevel })
    );

    const stanceSelections = Object.entries(stanceChoices).map(
      ([factionId, stanceId]) => ({ stanceId, factionId })
    );

    setIsMerging(true);
    try {
      const result = await mergeBills({
        keepBillId: keepBill.id,
        deleteBillIds,
        billUpdate,
        contentSelections,
        stanceSelections,
      });

      if (!result.success) {
        toast.error(result.error ?? "統合に失敗しました");
        return;
      }

      toast.success(
        `「${group.billNumber}」の重複${result.mergedCount}件を統合しました`
      );
      for (const w of result.warnings) {
        toast.warning(w);
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
        <CardTitle className="text-base font-semibold">
          {group.billNumber}
        </CardTitle>
        <p className="text-sm text-gray-500">
          {bills.length}件の重複 —
          各項目でどちらの値を保持するか選択してください
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ---- スカラーフィールド ---- */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            基本情報
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left w-[120px]">フィールド</th>
                  {bills.map((b, i) => (
                    <th
                      key={b.id}
                      className="px-3 py-2 text-left font-medium text-blue-700 bg-blue-50"
                    >
                      {i === 0 ? "【保持レコード】" : `【削除予定 ${i}】`}
                      <div className="text-xs font-normal text-gray-500 truncate max-w-[180px]">
                        {b.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCALAR_FIELDS.map((field) => {
                  const allSame = bills.every(
                    (b) => field.format(b) === field.format(bills[0])
                  );
                  return (
                    <tr key={field.key} className="border-b last:border-0">
                      <td className="px-3 py-2 text-gray-500 text-xs font-medium whitespace-nowrap">
                        {field.label}
                      </td>
                      {allSame ? (
                        <td
                          colSpan={bills.length}
                          className="px-3 py-2 text-sm text-gray-700"
                        >
                          {field.format(bills[0])}
                          <span className="ml-2 text-xs text-gray-400">
                            （全議案同一）
                          </span>
                        </td>
                      ) : (
                        bills.map((bill) => (
                          <RadioCell
                            key={bill.id}
                            name={`field-${group.billNumber}-${field.key}`}
                            value={bill.id}
                            checked={fieldChoices[field.key] === bill.id}
                            onChange={(v) =>
                              setFieldChoices((prev) => ({
                                ...prev,
                                [field.key]: v,
                              }))
                            }
                          >
                            {field.format(bill)}
                          </RadioCell>
                        ))
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- コンテンツ ---- */}
        {allDifficulties.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              コンテンツ（難易度別）
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-3 py-2 text-left w-[100px]">難易度</th>
                    {bills.map((b, i) => (
                      <th
                        key={b.id}
                        className="px-3 py-2 text-left font-medium text-blue-700 bg-blue-50"
                      >
                        {i === 0 ? "【保持】" : `【削除予定 ${i}】`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allDifficulties.map((dl) => {
                    const contentsForDl = bills.map((bill) =>
                      bill.contents.find((c) => c.difficulty_level === dl)
                    );
                    const allBillsHaveContent = contentsForDl.every(
                      (c) => c != null
                    );
                    const allSame =
                      allBillsHaveContent &&
                      contentsForDl.every(
                        (c) =>
                          c?.title === contentsForDl[0]?.title &&
                          c?.summary === contentsForDl[0]?.summary
                      );

                    return (
                      <tr key={dl} className="border-b last:border-0">
                        <td className="px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {DIFFICULTY_LABELS[dl] ?? dl}
                        </td>
                        {allSame ? (
                          <td
                            colSpan={bills.length}
                            className="px-3 py-2 text-sm"
                          >
                            <span className="font-medium">
                              {contentsForDl[0]?.title}
                            </span>
                            <span className="block text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {contentsForDl[0]?.summary}
                            </span>
                            <span className="text-xs text-gray-400">
                              （全議案同一）
                            </span>
                          </td>
                        ) : (
                          bills.map((bill) => {
                            const content = bill.contents.find(
                              (c) => c.difficulty_level === dl
                            );
                            if (!content) {
                              return (
                                <td
                                  key={bill.id}
                                  className="px-3 py-2 text-gray-400 text-xs"
                                >
                                  (なし)
                                </td>
                              );
                            }
                            return (
                              <RadioCell
                                key={bill.id}
                                name={`content-${group.billNumber}-${dl}`}
                                value={content.id}
                                checked={contentChoices[dl] === content.id}
                                onChange={(v) =>
                                  setContentChoices((prev) => ({
                                    ...prev,
                                    [dl]: v,
                                  }))
                                }
                              >
                                <span className="font-medium">
                                  {content.title}
                                </span>
                                <span className="block text-xs text-gray-500 line-clamp-2 mt-0.5">
                                  {content.summary}
                                </span>
                              </RadioCell>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- 会派見解 ---- */}
        {allFactionIds.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              会派見解（会派別）
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-3 py-2 text-left w-[120px]">会派</th>
                    {bills.map((b, i) => (
                      <th
                        key={b.id}
                        className="px-3 py-2 text-left font-medium text-blue-700 bg-blue-50"
                      >
                        {i === 0 ? "【保持】" : `【削除予定 ${i}】`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFactionIds.map((factionId) => {
                    const factionName =
                      bills
                        .flatMap((b) => b.stances)
                        .find((s) => s.faction_id === factionId)
                        ?.faction_name ?? factionId;

                    const stancesForFaction = bills.map((bill) =>
                      bill.stances.find((s) => s.faction_id === factionId)
                    );
                    const allBillsHaveStance = stancesForFaction.every(
                      (s) => s != null
                    );
                    const allSame =
                      allBillsHaveStance &&
                      stancesForFaction.every(
                        (s) =>
                          s?.type === stancesForFaction[0]?.type &&
                          s?.comment === stancesForFaction[0]?.comment
                      );

                    return (
                      <tr key={factionId} className="border-b last:border-0">
                        <td className="px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {factionName}
                        </td>
                        {allSame ? (
                          <td
                            colSpan={bills.length}
                            className="px-3 py-2 text-sm"
                          >
                            <span className="font-medium">
                              {STANCE_TYPE_LABELS[
                                stancesForFaction[0]?.type ?? ""
                              ] ?? stancesForFaction[0]?.type}
                            </span>
                            {stancesForFaction[0]?.comment && (
                              <span className="block text-xs text-gray-500 line-clamp-2 mt-0.5">
                                {stancesForFaction[0].comment}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              （全議案同一）
                            </span>
                          </td>
                        ) : (
                          bills.map((bill) => {
                            const stance = bill.stances.find(
                              (s) => s.faction_id === factionId
                            );
                            if (!stance) {
                              return (
                                <td
                                  key={bill.id}
                                  className="px-3 py-2 text-gray-400 text-xs"
                                >
                                  (なし)
                                </td>
                              );
                            }
                            return (
                              <RadioCell
                                key={bill.id}
                                name={`stance-${group.billNumber}-${factionId}`}
                                value={stance.id}
                                checked={stanceChoices[factionId] === stance.id}
                                onChange={(v) =>
                                  setStanceChoices((prev) => ({
                                    ...prev,
                                    [factionId]: v,
                                  }))
                                }
                              >
                                <span className="font-medium">
                                  {STANCE_TYPE_LABELS[stance.type] ??
                                    stance.type}
                                </span>
                                {stance.comment && (
                                  <span className="block text-xs text-gray-500 line-clamp-2 mt-0.5">
                                    {stance.comment}
                                  </span>
                                )}
                              </RadioCell>
                            );
                          })
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---- 統合ボタン ---- */}
        <div className="flex items-center gap-3 pt-2 border-t">
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
            選択内容で統合実行
          </Button>
          <p className="text-xs text-gray-500">
            「保持レコード」のIDが残り、他は削除されます。タグは全議案の和集合になります。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- BillsMergePage ----

type BillsMergePageProps = {
  initialGroups: DuplicateGroup[];
};

export function BillsMergePage({ initialGroups }: BillsMergePageProps) {
  const [groups, setGroups] = useState(initialGroups);

  const handleMerged = (billNumber: string) => {
    setGroups((prev) => prev.filter((g) => g.billNumber !== billNumber));
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
        同じ議案番号の議案が{groups.length}
        グループ見つかりました。各項目ごとにどちらの値を保持するか選択し、統合を実行してください。
      </p>

      {groups.map((group) => (
        <GroupCard
          key={group.billNumber}
          group={group}
          onMerged={() => handleMerged(group.billNumber)}
        />
      ))}
    </div>
  );
}
