"use client";

import { CheckCircle, Loader2, PauseCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CollectionRun } from "../../shared/types";

type RunHistoryProps = {
  runs: CollectionRun[];
  activeRunId: string | null;
  onSelectRun: (run: CollectionRun) => void;
};

export function RunHistory({
  runs,
  activeRunId,
  onSelectRun,
}: RunHistoryProps) {
  if (runs.length === 0) {
    return <p className="text-sm text-gray-500">収集履歴はありません。</p>;
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <button
          key={run.id}
          type="button"
          onClick={() => onSelectRun(run)}
          className={`w-full rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 ${
            activeRunId === run.id ? "border-blue-500 bg-blue-50" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusIcon status={run.status} />
              <span className="text-sm font-medium">
                {run.startDate} 〜 {run.endDate}
              </span>
            </div>
            <StatusBadge status={run.status} />
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
            <span>開始: {new Date(run.createdAt).toLocaleString("ja-JP")}</span>
            {run.completedAt && (
              <span>
                完了: {new Date(run.completedAt).toLocaleString("ja-JP")}
              </span>
            )}
            {run.status === "completed" && (
              <>
                <span>議案: {run.bills.length}件</span>
                <span>会派見解: {run.factionStances.length}件</span>
              </>
            )}
          </div>
          {run.error && (
            <p className="mt-1 text-xs text-red-500">{run.error}</p>
          )}
        </button>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: CollectionRun["status"] }) {
  if (status === "running") {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }
  if (status === "completed") {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
  if (status === "paused") {
    return <PauseCircle className="h-4 w-4 text-yellow-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function StatusBadge({ status }: { status: CollectionRun["status"] }) {
  if (status === "running") {
    return <Badge variant="default">収集中</Badge>;
  }
  if (status === "completed") {
    return <Badge variant="secondary">完了</Badge>;
  }
  if (status === "paused") {
    return (
      <Badge className="border-yellow-400 bg-yellow-100 text-yellow-800">
        一時停止
      </Badge>
    );
  }
  return <Badge variant="destructive">失敗</Badge>;
}
