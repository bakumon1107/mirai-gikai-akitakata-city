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
import { Textarea } from "@/components/ui/textarea";
import { deleteCommittee } from "../../server/actions/delete-committee";
import { updateCommittee } from "../../server/actions/update-committee";
import type { CommitteeWithBillCount } from "../../shared/types";

type CommitteeItemProps = {
  committee: CommitteeWithBillCount;
};

export function CommitteeItem({ committee }: CommitteeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(committee.name);
  const [editDescription, setEditDescription] = useState(
    committee.description ?? ""
  );
  const [editSortOrder, setEditSortOrder] = useState(
    committee.sort_order.toString()
  );
  const [editIsActive, setEditIsActive] = useState(committee.is_active);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("委員会名を入力してください");
      return;
    }

    const sortOrderNum = Number.parseInt(editSortOrder, 10);
    if (Number.isNaN(sortOrderNum)) {
      toast.error("表示順は数値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateCommittee({
        id: committee.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        sort_order: sortOrderNum,
        is_active: editIsActive,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("委員会を更新しました");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update committee error:", error);
      toast.error("委員会の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const result = await deleteCommittee({ id: committee.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("委員会を削除しました");
      }
    } catch (error) {
      console.error("Delete committee error:", error);
      toast.error("委員会の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(committee.name);
    setEditDescription(committee.description ?? "");
    setEditSortOrder(committee.sort_order.toString());
    setEditIsActive(committee.is_active);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border p-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>委員会名</Label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isSubmitting}
                autoFocus
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

            <div className="col-span-2 space-y-2">
              <Label>説明（任意）</Label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="委員会の説明を入力"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`is-active-${committee.id}`}
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4"
            />
            <Label htmlFor={`is-active-${committee.id}`}>有効</Label>
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
              <h3 className="font-semibold">{committee.name}</h3>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  committee.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {committee.is_active ? "有効" : "無効"}
              </span>
            </div>

            {committee.description && (
              <p className="text-sm text-gray-600">{committee.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>表示順: {committee.sort_order}</span>
              <span>議案: {committee.bill_count}件</span>
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
                  <AlertDialogTitle>委員会の削除</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{committee.name}」を削除しますか？
                    {committee.bill_count > 0 &&
                      `この委員会には${committee.bill_count}件の議案が紐付いているため削除できません。`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={committee.bill_count > 0}
                  >
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
