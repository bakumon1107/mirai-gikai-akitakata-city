"use client";

import { ChevronDown, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { applyDrafts } from "../../server/actions/apply-drafts";
import { getExistingBillsDetail } from "../../server/actions/get-existing-bills-detail";
import type {
  BillFieldOverride,
  CollectionRun,
  DraftBill,
  DraftFactionStance,
  ExistingBillDetail,
} from "../../shared/types";

type DraftReviewProps = {
  run: CollectionRun;
  existingBillNames: string[];
};

const STATUS_LABELS: Record<string, string> = {
  submitted: "提出",
  in_committee: "委員会審査",
  plenary_session: "本会議",
  approved: "可決",
  rejected: "否決",
  preparing: "準備中",
};

const STANCE_LABELS: Record<string, string> = {
  for: "賛成",
  against: "反対",
  neutral: "中立",
  absent: "欠席",
  conditional_for: "条件付き賛成",
  conditional_against: "条件付き反対",
  considering: "検討中",
  continued_deliberation: "継続審査",
};

const STANCE_VARIANTS: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  for: "default",
  against: "destructive",
  neutral: "secondary",
  absent: "outline",
  conditional_for: "default",
  conditional_against: "destructive",
  considering: "secondary",
  continued_deliberation: "outline",
};

type OverrideState = {
  updateStatus: boolean;
  updateContents: boolean;
  stances: Record<string, boolean>;
};

type DiffItem =
  | { key: "status"; label: string; from: string; to: string }
  | { key: "contents"; label: string; from: string; to: string }
  | {
      key: `stance_${string}`;
      factionName: string;
      label: string;
      from: string;
      to: string;
    };

function computeDiffs(
  draft: DraftBill,
  detail: ExistingBillDetail,
  runStances: DraftFactionStance[]
): DiffItem[] {
  const diffs: DiffItem[] = [];

  if (draft.status !== detail.status) {
    diffs.push({
      key: "status",
      label: "ステータス",
      from: STATUS_LABELS[detail.status] ?? detail.status,
      to: STATUS_LABELS[draft.status] ?? draft.status,
    });
  }

  const currentSummary = detail.contents?.summary ?? "";
  const newSummary = draft.summary.slice(0, 500);
  if (currentSummary !== newSummary) {
    diffs.push({
      key: "contents",
      label: "概要・本文",
      from: currentSummary || "（なし）",
      to: newSummary,
    });
  }

  for (const draftStance of runStances) {
    const existing = detail.factionStances.find(
      (s) =>
        s.factionName === draftStance.factionName ||
        s.factionName.includes(draftStance.factionName) ||
        draftStance.factionName.includes(s.factionName)
    );
    const fromType = existing?.type ?? "";
    const toType =
      draftStance.stanceType === "absent" ? "" : draftStance.stanceType;
    const fromComment = existing?.comment ?? "";
    const toComment = draftStance.comment ?? "";

    if (fromType !== toType || fromComment !== toComment) {
      diffs.push({
        key: `stance_${draftStance.factionName}`,
        factionName: draftStance.factionName,
        label: `会派「${draftStance.factionName}」の賛否`,
        from: fromType ? (STANCE_LABELS[fromType] ?? fromType) : "（なし）",
        to:
          draftStance.stanceType === "absent"
            ? "欠席（適用不可）"
            : (STANCE_LABELS[draftStance.stanceType] ?? draftStance.stanceType),
      });
    }
  }

  return diffs;
}

function buildInitialOverride(diffs: DiffItem[]): OverrideState {
  const stances: Record<string, boolean> = {};
  for (const diff of diffs) {
    if (diff.key.startsWith("stance_") && "factionName" in diff) {
      stances[diff.factionName] = true;
    }
  }
  return {
    updateStatus: diffs.some((d) => d.key === "status"),
    updateContents: diffs.some((d) => d.key === "contents"),
    stances,
  };
}

export function DraftReview({ run, existingBillNames }: DraftReviewProps) {
  const existingSet = new Set(existingBillNames);

  const newBills = run.bills.filter((b) => !existingSet.has(b.title));
  const existingBills = run.bills.filter((b) => existingSet.has(b.title));

  const [selectedNewIds, setSelectedNewIds] = useState<Set<string>>(
    new Set(newBills.map((b) => b.id))
  );
  const [overrides, setOverrides] = useState<Map<string, OverrideState>>(
    new Map()
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [diffsMap, setDiffsMap] = useState<Map<string, DiffItem[]>>(new Map());

  // Fetch existing bill details on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (existingBills.length === 0) return;

    setIsLoadingDetails(true);
    void getExistingBillsDetail(existingBills.map((b) => b.title)).then(
      (details) => {
        const detailMap = new Map(details.map((d) => [d.name, d]));

        // Compute diffs and initialize overrides
        const newDiffsMap = new Map<string, DiffItem[]>();
        const newOverrides = new Map<string, OverrideState>();

        for (const bill of existingBills) {
          const detail = detailMap.get(bill.title);
          if (!detail) continue;
          const runStances = run.factionStances.filter(
            (s) => s.billTitle === bill.title
          );
          const diffs = computeDiffs(bill, detail, runStances);
          newDiffsMap.set(bill.id, diffs);
          newOverrides.set(bill.id, buildInitialOverride(diffs));
        }

        setDiffsMap(newDiffsMap);
        setOverrides(newOverrides);
        setIsLoadingDetails(false);
      }
    );
  }, []); // only on mount

  const toggleNewBill = (id: string) => {
    setSelectedNewIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateOverride = useCallback(
    (billId: string, updater: (prev: OverrideState) => OverrideState) => {
      setOverrides((prev) => {
        const current = prev.get(billId) ?? {
          updateStatus: false,
          updateContents: false,
          stances: {},
        };
        const next = new Map(prev);
        next.set(billId, updater(current));
        return next;
      });
    },
    []
  );

  const handleApply = async () => {
    const existingBillOverrides: BillFieldOverride[] = [];
    for (const bill of existingBills) {
      const override = overrides.get(bill.id);
      if (!override) continue;
      existingBillOverrides.push({
        draftBillId: bill.id,
        updateStatus: override.updateStatus,
        updateContents: override.updateContents,
        stanceUpdates: Object.entries(override.stances).map(
          ([factionName, update]) => ({ factionName, update })
        ),
      });
    }

    const totalCount =
      selectedNewIds.size +
      existingBillOverrides.filter(
        (o) =>
          o.updateStatus ||
          o.updateContents ||
          o.stanceUpdates.some((s) => s.update)
      ).length;

    if (totalCount === 0) {
      toast.error("適用する議案または変更を選択してください");
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyDrafts({
        runId: run.id,
        newBillIds: Array.from(selectedNewIds),
        existingBillOverrides,
      });

      if (!result.success) {
        toast.error(result.error ?? "適用に失敗しました");
        return;
      }

      toast.success(
        `${result.appliedCount}件の議案をローカルSupabaseに適用しました`
      );
      for (const w of result.warnings) {
        toast.warning(w);
      }
    } catch (err) {
      console.error("Apply drafts error:", err);
      toast.error("適用に失敗しました");
    } finally {
      setIsApplying(false);
    }
  };

  if (run.bills.length === 0) {
    return (
      <p className="text-sm text-gray-500">収集された議案はありません。</p>
    );
  }

  const existingWithDiffs = existingBills.filter(
    (b) => (diffsMap.get(b.id)?.length ?? 0) > 0
  );

  const applyCount =
    selectedNewIds.size +
    existingBills.filter((b) => {
      const override = overrides.get(b.id);
      return (
        override &&
        (override.updateStatus ||
          override.updateContents ||
          Object.values(override.stances).some(Boolean))
      );
    }).length;

  return (
    <div className="space-y-6">
      {/* Bills table */}
      <div>
        <h3 className="mb-3 text-base font-semibold">
          議案一覧（{run.bills.length}件）
          {existingBills.length > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-600">
              うち{existingBills.length}件は既存議案
            </span>
          )}
        </h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="w-10 px-3 py-2 text-center">選択</th>
                <th className="px-3 py-2 text-left">状態</th>
                <th className="px-3 py-2 text-left">議案番号</th>
                <th className="px-3 py-2 text-left">タイトル</th>
                <th className="px-3 py-2 text-left">ステータス</th>
                <th className="px-3 py-2 text-left">提出者</th>
                <th className="px-3 py-2 text-left">概要</th>
                <th className="px-3 py-2 text-left">参照URL</th>
              </tr>
            </thead>
            <tbody>
              {run.bills.map((bill) => {
                const isExisting = existingSet.has(bill.title);
                const isExpanded = expandedIds.has(bill.id);
                const diffs = diffsMap.get(bill.id) ?? [];
                const override = overrides.get(bill.id);

                return (
                  <React.Fragment key={bill.id}>
                    <tr className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 text-center">
                        {isExisting ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleExpanded(bill.id)}
                            disabled={isLoadingDetails}
                          >
                            {isLoadingDetails ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <Checkbox
                            checked={selectedNewIds.has(bill.id)}
                            onCheckedChange={() => toggleNewBill(bill.id)}
                          />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isExisting ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-400"
                          >
                            既存
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-400"
                          >
                            新規
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {bill.billNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-medium">{bill.title}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">
                          {STATUS_LABELS[bill.status] ?? bill.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {bill.submitter ?? "—"}
                      </td>
                      <td className="max-w-xs px-3 py-2 text-gray-600">
                        <p className="line-clamp-2">{bill.summary}</p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1">
                          {bill.sourceUrls.map((url) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="max-w-[200px] truncate text-xs">
                                {url}
                              </span>
                            </a>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Diff sub-rows for existing bills */}
                    {isExisting &&
                      isExpanded &&
                      !isLoadingDetails &&
                      (diffs.length === 0 ? (
                        <tr className="border-b bg-amber-50">
                          <td />
                          <td
                            colSpan={7}
                            className="px-6 py-2 text-sm text-gray-500 italic"
                          >
                            差分なし（DBの値とAI収集結果が一致しています）
                          </td>
                        </tr>
                      ) : (
                        diffs.map((diff) => {
                          const isChecked =
                            diff.key === "status"
                              ? (override?.updateStatus ?? false)
                              : diff.key === "contents"
                                ? (override?.updateContents ?? false)
                                : diff.key.startsWith("stance_") &&
                                    "factionName" in diff
                                  ? (override?.stances[diff.factionName] ??
                                    false)
                                  : false;

                          const handleChange = (checked: boolean) => {
                            updateOverride(bill.id, (prev) => {
                              if (diff.key === "status") {
                                return { ...prev, updateStatus: checked };
                              }
                              if (diff.key === "contents") {
                                return { ...prev, updateContents: checked };
                              }
                              if (
                                diff.key.startsWith("stance_") &&
                                "factionName" in diff
                              ) {
                                return {
                                  ...prev,
                                  stances: {
                                    ...prev.stances,
                                    [diff.factionName]: checked,
                                  },
                                };
                              }
                              return prev;
                            });
                          };

                          const isAbsentStance =
                            diff.key.startsWith("stance_") &&
                            "factionName" in diff &&
                            run.factionStances.find(
                              (s) =>
                                s.factionName === diff.factionName &&
                                s.billTitle === bill.title
                            )?.stanceType === "absent";

                          return (
                            <tr
                              key={diff.key}
                              className="border-b bg-amber-50 last:border-0"
                            >
                              <td className="px-3 py-2 text-center">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(v) => handleChange(!!v)}
                                  disabled={!!isAbsentStance}
                                />
                              </td>
                              <td
                                colSpan={2}
                                className="px-6 py-2 text-xs text-gray-500 font-medium"
                              >
                                {diff.label}
                              </td>
                              <td colSpan={5} className="px-3 py-2 text-xs">
                                <span className="text-gray-500 line-through">
                                  {diff.key === "contents"
                                    ? diff.from.slice(0, 80) +
                                      (diff.from.length > 80 ? "…" : "")
                                    : diff.from}
                                </span>
                                <span className="mx-2 text-gray-400">→</span>
                                <span className="text-blue-700 font-medium">
                                  {diff.key === "contents"
                                    ? diff.to.slice(0, 80) +
                                      (diff.to.length > 80 ? "…" : "")
                                    : diff.to}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {existingWithDiffs.length > 0 && !isLoadingDetails && (
          <p className="mt-2 text-xs text-amber-600">
            ※ 既存議案の行の ▶ をクリックすると差分を確認・選択できます
          </p>
        )}
      </div>

      {/* Faction stances table */}
      {run.factionStances.length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold">
            会派見解（{run.factionStances.length}件）
          </h3>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left">議案名</th>
                  <th className="px-3 py-2 text-left">会派名</th>
                  <th className="px-3 py-2 text-left">賛否</th>
                  <th className="px-3 py-2 text-left">コメント</th>
                  <th className="px-3 py-2 text-left">参照URL</th>
                </tr>
              </thead>
              <tbody>
                {run.factionStances.map((stance) => (
                  <tr
                    key={stance.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="max-w-xs px-3 py-2">
                      <p className="line-clamp-2">{stance.billTitle}</p>
                    </td>
                    <td className="px-3 py-2">{stance.factionName}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          STANCE_VARIANTS[stance.stanceType] ?? "outline"
                        }
                      >
                        {STANCE_LABELS[stance.stanceType] ?? stance.stanceType}
                      </Badge>
                    </td>
                    <td className="max-w-xs px-3 py-2 text-gray-600">
                      <p className="line-clamp-2">{stance.comment ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {stance.sourceUrls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="max-w-[200px] truncate text-xs">
                              {url}
                            </span>
                          </a>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sources */}
      {run.sources.length > 0 && (
        <div>
          <h3 className="mb-2 text-base font-semibold">参照ソース</h3>
          <ul className="space-y-1">
            {run.sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Apply button */}
      <div className="rounded-md border bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleApply}
            disabled={isApplying || isLoadingDetails || applyCount === 0}
          >
            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ローカルSupabaseに適用（{applyCount}件）
          </Button>
          <p className="text-xs text-gray-500">
            ※ 現在はローカルSupabase（.envのSUPABASE_URL）に適用されます
          </p>
        </div>
      </div>
    </div>
  );
}
