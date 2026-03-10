"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { deleteStance } from "../../server/actions/delete-stance";
import { upsertStance } from "../../server/actions/upsert-stance";
import type { Faction } from "../../server/loaders/get-factions";
import type { FactionStanceWithFaction } from "../../server/loaders/get-stances-by-bill-id";
import { STANCE_TYPE_LABELS, type StanceTypeEnum } from "../../shared/types";

type FactionStanceRowProps = {
  billId: string;
  billStatus: string;
  faction: Faction;
  existingStance: FactionStanceWithFaction | null;
};

function FactionStanceRow({
  billId,
  billStatus,
  faction,
  existingStance,
}: FactionStanceRowProps) {
  const router = useRouter();
  const isPreparing = billStatus === "preparing";

  const [selectedType, setSelectedType] = useState<StanceTypeEnum | "">(
    existingStance?.type ?? ""
  );
  const [comment, setComment] = useState(existingStance?.comment ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!selectedType) {
      toast.error("見解種別を選択してください");
      return;
    }

    setIsSaving(true);
    try {
      const result = await upsertStance(billId, faction.id, {
        type: selectedType,
        comment: comment || undefined,
      });

      if (result.success) {
        toast.success(`${faction.display_name}の見解を保存しました`);
        router.refresh();
      } else {
        toast.error(result.error ?? "保存に失敗しました");
      }
    } catch {
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingStance) return;
    if (!confirm(`${faction.display_name}の見解を削除してもよろしいですか？`))
      return;

    setIsDeleting(true);
    try {
      const result = await deleteStance(existingStance.id);

      if (result.success) {
        toast.success(`${faction.display_name}の見解を削除しました`);
        setSelectedType("");
        setComment("");
        router.refresh();
      } else {
        toast.error(result.error ?? "削除に失敗しました");
      }
    } catch {
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="font-medium text-sm text-gray-700">
        {faction.display_name}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Select
            value={selectedType}
            onValueChange={(v) => setSelectedType(v as StanceTypeEnum)}
            disabled={isPreparing}
          >
            <SelectTrigger>
              <SelectValue placeholder="見解を選択" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STANCE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isPreparing || !selectedType}
          >
            {isSaving ? "保存中..." : existingStance ? "更新" : "追加"}
          </Button>
          {existingStance && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting || isPreparing}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="コメント・理由（任意）"
        className="min-h-[80px] resize-y text-sm"
        disabled={isPreparing}
      />
    </div>
  );
}

type StancesManagerProps = {
  billId: string;
  billStatus: string;
  factions: Faction[];
  stances: FactionStanceWithFaction[];
};

export function StancesManager({
  billId,
  billStatus,
  factions,
  stances,
}: StancesManagerProps) {
  const isPreparing = billStatus === "preparing";

  const stanceByFactionId = new Map(stances.map((s) => [s.faction_id, s]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>会派見解</CardTitle>
        {isPreparing && (
          <p className="text-sm text-muted-foreground">
            議案上程前のため、見解設定は無効化されています。
          </p>
        )}
      </CardHeader>
      <CardContent>
        {factions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            登録済みの会派がありません。先に会派を登録してください。
          </p>
        ) : (
          <div className="space-y-3">
            {factions.map((faction) => (
              <FactionStanceRow
                key={faction.id}
                billId={billId}
                billStatus={billStatus}
                faction={faction}
                existingStance={stanceByFactionId.get(faction.id) ?? null}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
