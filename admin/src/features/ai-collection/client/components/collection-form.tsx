"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CollectionFormProps = {
  onRunStarted: (runId: string) => void;
};

export function CollectionForm({ onRunStarted }: CollectionFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      toast.error("開始日と終了日を入力してください", { duration: Infinity });
      return false;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("終了日は開始日以降の日付を指定してください", {
        duration: Infinity,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDates()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai-collection/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = (await res.json()) as { runId?: string; error?: string };

      if (!res.ok || !data.runId) {
        toast.error(data.error ?? "収集の開始に失敗しました", {
          duration: Infinity,
        });
        return;
      }

      toast.success("情報収集を開始しました");
      onRunStarted(data.runId);
    } catch (err) {
      console.error("Collection start error:", err);
      toast.error("収集の開始に失敗しました", { duration: Infinity });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusCheck = async () => {
    if (!validateDates()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/ai-collection/start-status-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      const data = (await res.json()) as { runId?: string; error?: string };

      if (!res.ok || !data.runId) {
        toast.error(data.error ?? "ステータスチェックの開始に失敗しました", {
          duration: Infinity,
        });
        return;
      }

      toast.success("ステータスチェックを開始しました");
      onRunStarted(data.runId);
    } catch (err) {
      console.error("Status check start error:", err);
      toast.error("ステータスチェックの開始に失敗しました", {
        duration: Infinity,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label htmlFor="start-date">開始日</Label>
        <Input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end-date">終了日</Label>
        <Input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        収集開始
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => void handleStatusCheck()}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        ステータス更新チェック
      </Button>
    </form>
  );
}
