"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFaction } from "../../server/actions/create-faction";

/** カンマ区切り文字列を別名配列に変換 */
function parseAlternativeNames(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FactionForm() {
  const nameId = useId();
  const displayNameId = useId();
  const alternativeNamesId = useId();
  const logoUrlId = useId();
  const sortOrderId = useId();

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [alternativeNames, setAlternativeNames] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("識別名を入力してください");
      return;
    }

    if (!displayName.trim()) {
      toast.error("表示名を入力してください");
      return;
    }

    const sortOrderNum = Number.parseInt(sortOrder, 10);
    if (Number.isNaN(sortOrderNum)) {
      toast.error("表示順は数値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createFaction({
        name: name.trim(),
        display_name: displayName.trim(),
        alternative_names: parseAlternativeNames(alternativeNames),
        logo_url: logoUrl.trim() || null,
        sort_order: sortOrderNum,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("会派を作成しました");
        setName("");
        setDisplayName("");
        setAlternativeNames("");
        setLogoUrl("");
        setSortOrder("0");
      }
    } catch (error) {
      console.error("Create faction error:", error);
      toast.error("会派の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={nameId}>
            識別名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: komeito"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500">英小文字・数字・ハイフンのみ</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={displayNameId}>
            表示名（正式名称） <span className="text-red-500">*</span>
          </Label>
          <Input
            id={displayNameId}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="例: 公明党"
            disabled={isSubmitting}
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor={alternativeNamesId}>別名（任意）</Label>
          <Input
            id={alternativeNamesId}
            type="text"
            value={alternativeNames}
            onChange={(e) => setAlternativeNames(e.target.value)}
            placeholder="例: 公明, 公明党議員団"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500">
            略称・旧称など。カンマ区切りで複数入力可。AI収集時の会派名マッチングに使用されます。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={logoUrlId}>ロゴURL（任意）</Label>
          <Input
            id={logoUrlId}
            type="text"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
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
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "追加中..." : "追加"}
        </Button>
      </div>
    </form>
  );
}
