"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCommittee } from "../../server/actions/create-committee";

export function CommitteeForm() {
  const nameId = useId();
  const descriptionId = useId();
  const sortOrderId = useId();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("委員会名を入力してください");
      return;
    }

    const sortOrderNum = Number.parseInt(sortOrder, 10);
    if (Number.isNaN(sortOrderNum)) {
      toast.error("表示順は数値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCommittee({
        name: name.trim(),
        description: description.trim() || null,
        sort_order: sortOrderNum,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("委員会を作成しました");
        setName("");
        setDescription("");
        setSortOrder("0");
      }
    } catch (error) {
      console.error("Create committee error:", error);
      toast.error("委員会の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={nameId}>
            委員会名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 総務委員会"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={sortOrderId}>表示順</Label>
          <Input
            id={sortOrderId}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor={descriptionId}>説明（任意）</Label>
          <Textarea
            id={descriptionId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="委員会の説明を入力"
            disabled={isSubmitting}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "追加中..." : "追加"}
        </Button>
      </div>
    </form>
  );
}
