"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteFaction } from "../../server/actions/delete-faction";
import { updateFaction } from "../../server/actions/update-faction";
import type { FactionWithStanceCount } from "../../shared/types";

type FactionItemProps = {
  faction: FactionWithStanceCount;
};

/** 別名配列をカンマ区切り文字列に変換 */
function formatAlternativeNames(names: string[]): string {
  return names.join(", ");
}

/** カンマ区切り文字列を別名配列に変換 */
function parseAlternativeNames(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FactionItem({ faction }: FactionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(faction.name);
  const [editDisplayName, setEditDisplayName] = useState(faction.display_name);
  const [editAlternativeNames, setEditAlternativeNames] = useState(
    formatAlternativeNames(faction.alternative_names)
  );
  const [editLogoUrl, setEditLogoUrl] = useState(faction.logo_url ?? "");
  const [editSortOrder, setEditSortOrder] = useState(
    faction.sort_order.toString()
  );
  const [editIsActive, setEditIsActive] = useState(faction.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("識別名を入力してください");
      return;
    }

    if (!editDisplayName.trim()) {
      toast.error("表示名を入力してください");
      return;
    }

    const sortOrderNum = Number.parseInt(editSortOrder, 10);
    if (Number.isNaN(sortOrderNum)) {
      toast.error("表示順は数値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateFaction({
        id: faction.id,
        name: editName.trim(),
        display_name: editDisplayName.trim(),
        alternative_names: parseAlternativeNames(editAlternativeNames),
        logo_url: editLogoUrl.trim() || null,
        sort_order: sortOrderNum,
        is_active: editIsActive,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("会派を更新しました");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update faction error:", error);
      toast.error("会派の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const result = await deleteFaction({ id: faction.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("会派を削除しました");
      }
    } catch (error) {
      console.error("Delete faction error:", error);
      toast.error("会派の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(faction.name);
    setEditDisplayName(faction.display_name);
    setEditAlternativeNames(formatAlternativeNames(faction.alternative_names));
    setEditLogoUrl(faction.logo_url ?? "");
    setEditSortOrder(faction.sort_order.toString());
    setEditIsActive(faction.is_active);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border p-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>識別名</Label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>表示名（正式名称）</Label>
              <Input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>別名（任意）</Label>
              <Input
                type="text"
                value={editAlternativeNames}
                onChange={(e) => setEditAlternativeNames(e.target.value)}
                disabled={isSubmitting}
                placeholder="例: 公明, 公明党議員団"
              />
              <p className="text-xs text-gray-500">
                略称・旧称など。カンマ区切りで複数入力可。AI収集時の会派名マッチングに使用されます。
              </p>
            </div>

            <div className="space-y-2">
              <Label>ロゴURL（任意）</Label>
              <Input
                type="text"
                value={editLogoUrl}
                onChange={(e) => setEditLogoUrl(e.target.value)}
                disabled={isSubmitting}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>表示順</Label>
              <Input
                type="number"
                value={editSortOrder}
                onChange={(e) => setEditSortOrder(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`is-active-${faction.id}`}
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4"
            />
            <Label htmlFor={`is-active-${faction.id}`}>有効</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{faction.display_name}</h3>
              <span className="text-sm text-gray-500">({faction.name})</span>
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  faction.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {faction.is_active ? "有効" : "無効"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>表示順: {faction.sort_order}</span>
              <span>見解: {faction.stance_count}件</span>
              {faction.alternative_names.length > 0 && (
                <span>別名: {faction.alternative_names.join(", ")}</span>
              )}
              {faction.logo_url && (
                <span className="max-w-xs truncate" title={faction.logo_url}>
                  ロゴ: {faction.logo_url}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isSubmitting}
            >
              編集
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isSubmitting}>
                  削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>会派の削除</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{faction.display_name}
                    」を削除しますか？紐付く会派見解もすべて削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    削除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
