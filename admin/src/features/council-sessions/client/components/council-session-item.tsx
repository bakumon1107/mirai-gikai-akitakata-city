"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { siteConfig } from "@/config/site.config";
import { env } from "@/lib/env";
import { deleteCouncilSession } from "../../server/actions/delete-council-session";
import { setActiveCouncilSession } from "../../server/actions/set-active-council-session";
import { updateCouncilSession } from "../../server/actions/update-council-session";
import type { CouncilSession } from "../../shared/types";

type CouncilSessionItemProps = {
  session: CouncilSession;
};

export function CouncilSessionItem({ session }: CouncilSessionItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [editSlug, setEditSlug] = useState(session.slug ?? "");
  const [editCouncilUrl, setEditCouncilUrl] = useState(
    session.council_url ?? ""
  );
  const [editStartDate, setEditStartDate] = useState(session.start_date);
  const [editEndDate, setEditEndDate] = useState(session.end_date ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("定例会名を入力してください");
      return;
    }

    if (!editStartDate) {
      toast.error("開始日を入力してください");
      return;
    }

    // 変更がない場合は編集モードを終了
    if (
      editName === session.name &&
      editSlug === (session.slug ?? "") &&
      editCouncilUrl === (session.council_url ?? "") &&
      editStartDate === session.start_date &&
      editEndDate === (session.end_date ?? "")
    ) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateCouncilSession({
        id: session.id,
        name: editName,
        slug: editSlug || null,
        council_url: editCouncilUrl || null,
        start_date: editStartDate,
        end_date: editEndDate || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("定例会を更新しました");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update council session error:", error);
      toast.error("定例会の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const result = await deleteCouncilSession({ id: session.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("定例会を削除しました");
      }
    } catch (error) {
      console.error("Delete council session error:", error);
      toast.error("定例会の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(session.name);
    setEditSlug(session.slug ?? "");
    setEditCouncilUrl(session.council_url ?? "");
    setEditStartDate(session.start_date);
    setEditEndDate(session.end_date ?? "");
    setIsEditing(false);
  };

  const handleSetActive = async () => {
    setIsSubmitting(true);

    try {
      const result = await setActiveCouncilSession({ id: session.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`「${session.name}」をアクティブな定例会に設定しました`);
        router.refresh();
      }
    } catch (error) {
      console.error("Set active council session error:", error);
      toast.error("アクティブ設定に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        {isEditing ? (
          <div className="flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="定例会名"
                disabled={isSubmitting}
              />
              <Input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="スラッグ（例: 219-rinji）"
                disabled={isSubmitting}
              />
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Input
              type="url"
              value={editCouncilUrl}
              onChange={(e) => setEditCouncilUrl(e.target.value)}
              placeholder={`議会URL（${siteConfig.councilBaseUrl}...）`}
              disabled={isSubmitting}
            />
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium">
              {session.name}
              {session.is_active && (
                <Badge variant="default" className="bg-green-600">
                  アクティブ
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {session.slug && (
                <Link
                  href={`${env.webUrl}/sessions/${session.slug}/bills` as Route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 text-blue-600 hover:underline"
                >
                  /{session.slug}
                </Link>
              )}
              {formatDate(session.start_date)} 〜{" "}
              {session.end_date ? formatDate(session.end_date) : "未定"}
            </div>
            {session.council_url && (
              <div className="text-sm text-gray-500 mt-1">
                <a
                  href={session.council_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  議会ページ ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </>
          ) : (
            <>
              {!session.is_active && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      アクティブにする
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-orange-600">
                        アクティブな定例会の変更
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            「{session.name}
                            」をアクティブな定例会に設定しますか？
                          </p>
                          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-800">
                            <p className="font-semibold">
                              この操作はトップページに影響します
                            </p>
                            <ul className="mt-2 list-disc list-inside text-sm">
                              <li>
                                トップページに表示される議案が、この定例会の議案に切り替わります
                              </li>
                              <li>
                                現在アクティブな定例会は非アクティブになります
                              </li>
                              <li>
                                ユーザーがトップページで確認できる議案が変わります
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSetActive}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        アクティブにする
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

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
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>定例会の削除</AlertDialogTitle>
                    <AlertDialogDescription>
                      この定例会を削除しますか？この操作は取り消せません。
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
