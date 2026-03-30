"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { siteConfig } from "@/config/site.config";
import { createCouncilSession } from "../../server/actions/create-council-session";

export function CouncilSessionForm() {
  const nameId = useId();
  const slugId = useId();
  const councilUrlId = useId();
  const startDateId = useId();
  const endDateId = useId();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [councilUrl, setCouncilUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("定例会名を入力してください");
      return;
    }

    if (!startDate) {
      toast.error("開始日を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCouncilSession({
        name,
        slug: slug || null,
        council_url: councilUrl || null,
        start_date: startDate,
        end_date: endDate || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("定例会を作成しました");
        setName("");
        setSlug("");
        setCouncilUrl("");
        setStartDate("");
        setEndDate("");
      }
    } catch (error) {
      console.error("Create council session error:", error);
      toast.error("定例会の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={nameId}>定例会名</Label>
          <Input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="令和8年 第1回定例会"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={slugId}>スラッグ（URL用）</Label>
          <Input
            id={slugId}
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="例: 219-rinji"
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={startDateId}>開始日</Label>
          <Input
            id={startDateId}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={endDateId}>終了日（任意）</Label>
          <Input
            id={endDateId}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={councilUrlId}>議会URL</Label>
        <Input
          id={councilUrlId}
          type="url"
          value={councilUrl}
          onChange={(e) => setCouncilUrl(e.target.value)}
          placeholder={`${siteConfig.councilBaseUrl}...`}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "追加中..." : "追加"}
        </Button>
      </div>
    </form>
  );
}
