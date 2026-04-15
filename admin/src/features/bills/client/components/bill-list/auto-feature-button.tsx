"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type AutoFeatureResult,
  runAutoFeature,
} from "../../../server/actions/run-auto-feature";

type Props = {
  councilSessionId: string;
  sessionName: string;
};

export function AutoFeatureButton({ councilSessionId, sessionName }: Props) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AutoFeatureResult | null>(null);

  const handleRun = async () => {
    if (
      !confirm(
        `「${sessionName}」の公開済み議案に対して注目判定を実行しますか？\n現在の is_featured フラグは上書きされます。`
      )
    )
      return;

    setIsRunning(true);
    setResult(null);
    try {
      const res = await runAutoFeature(councilSessionId);
      setResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        onClick={handleRun}
        disabled={isRunning}
        className="gap-1.5"
      >
        <Sparkles className="h-4 w-4" />
        {isRunning ? "AI評価中..." : "注目議案を自動設定"}
      </Button>

      {result && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">注目議案 自動設定 完了</h2>
                <p className="text-sm text-gray-500">
                  {result.success
                    ? `${result.totalEvaluated}件を評価 → ${result.featuredCount}件を注目に設定`
                    : `エラー: ${result.error}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResult(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {result.warnings.length > 0 && (
              <div className="px-4 pt-3">
                {result.warnings.map((w) => (
                  <p
                    key={w}
                    className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded mb-1"
                  >
                    ⚠️ {w}
                  </p>
                ))}
              </div>
            )}

            {result.results.length > 0 && (
              <div className="overflow-y-auto flex-1 p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 pr-2">議案番号</th>
                      <th className="pb-2 pr-2 text-right">スコア</th>
                      <th className="pb-2 pr-2 text-center">除外</th>
                      <th className="pb-2 pr-2">タグ</th>
                      <th className="pb-2 pr-2">内訳</th>
                      <th className="pb-2">理由</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => {
                      const isFeatured = !r.excluded && r.score >= 75;
                      return (
                        <tr
                          key={r.bill_number}
                          className={`border-b last:border-0 ${isFeatured ? "bg-yellow-50" : ""}`}
                        >
                          <td className="py-1.5 pr-2 font-medium">
                            {isFeatured && <span className="mr-1">★</span>}
                            {r.bill_number}
                          </td>
                          <td className="py-1.5 pr-2 text-right font-mono">
                            {r.score}点
                          </td>
                          <td className="py-1.5 pr-2 text-center text-xs text-gray-500">
                            {r.excluded ? "除外" : ""}
                          </td>
                          <td className="py-1.5 pr-2 text-xs text-gray-600 whitespace-nowrap">
                            {r.primary_tag ?? ""}
                          </td>
                          <td className="py-1.5 pr-2 text-xs text-gray-500 font-mono whitespace-nowrap">
                            {r.breakdown.influence_range}/
                            {r.breakdown.life_impact}/{r.breakdown.interest}
                          </td>
                          <td className="py-1.5 text-xs text-gray-600">
                            {r.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-4 border-t text-right">
              <Button onClick={() => setResult(null)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
