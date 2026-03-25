"use client";

import { type Control, useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BillStatus } from "@/features/bills/shared/types";
import type { Committee } from "@/features/committees/shared/types";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import type { BillCreateInput } from "../../shared/types";
import { GenerateThumbnailButton } from "./generate-thumbnail-button";
import { ThumbnailUpload } from "./thumbnail-upload";

const BILL_STATUS_OPTIONS: Array<{ value: BillStatus; label: string }> = [
  { value: "preparing", label: "議案上程前" },
  { value: "submitted", label: "上程済み" },
  { value: "in_committee", label: "委員会審査中" },
  { value: "plenary_session", label: "本会議採決中" },
  { value: "approved", label: "可決" },
  { value: "rejected", label: "否決" },
  { value: "reported", label: "専決処分報告" },
];

interface BillFormFieldsProps {
  control: Control<BillCreateInput>;
  billId?: string;
  councilSessions: CouncilSession[];
  committees: Committee[];
}

export function BillFormFields({
  control,
  billId,
  councilSessions,
  committees,
}: BillFormFieldsProps) {
  const { setValue } = useFormContext<BillCreateInput>();
  const billName = useWatch({ control, name: "name" });
  const thumbnailUrl = useWatch({ control, name: "thumbnail_url" });
  const shareThumbnailUrl = useWatch({
    control,
    name: "share_thumbnail_url",
  });

  return (
    <>
      <FormField
        control={control}
        name="bill_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案番号 *</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>
              議案番号を入力してください（例:「第1号」「報告第1号」）。未設定の場合は空白のままにしてください。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案名 *</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              議案の正式名称を入力してください（最大200文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ステータス *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {BILL_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>現在の審議状況を選択してください</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="status_note"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ステータス備考</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value || ""}
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              審議状況の詳細や補足情報を入力してください（最大500文字）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="published_at"
        render={({ field }) => (
          <FormItem>
            <FormLabel>公開日時 *</FormLabel>
            <FormControl>
              <Input type="datetime-local" {...field} />
            </FormControl>
            <FormDescription>
              議案が公開される日時を設定してください
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>サムネイル画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
              />
            </FormControl>
            <FormDescription>
              議案のサムネイル画像を設定してください（任意）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormItem>
        <FormDescription>
          議案名からAIでサムネイル画像を自動生成します。生成した画像はサムネイルとOGP画像の両方に設定されます。
        </FormDescription>
        <GenerateThumbnailButton
          billId={billId}
          billName={billName}
          currentThumbnailUrl={thumbnailUrl}
          currentShareThumbnailUrl={shareThumbnailUrl}
          onGenerated={(url) => {
            setValue("thumbnail_url", url);
            setValue("share_thumbnail_url", url);
          }}
        />
      </FormItem>

      <FormField
        control={control}
        name="share_thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>シェア用OGP画像</FormLabel>
            <FormControl>
              <ThumbnailUpload
                value={field.value}
                onChange={field.onChange}
                billId={billId}
                storagePrefix="share"
              />
            </FormControl>
            <FormDescription>
              Twitter等のSNSでシェアされた際に表示される画像を設定してください（任意）。設定しない場合はサムネイル画像が使用されます。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="committee_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>委員会</FormLabel>
            <Select
              onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
              value={field.value ?? "__none__"}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="委員会を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__none__">なし</SelectItem>
                {committees
                  .filter((c) => c.is_active)
                  .map((committee) => (
                    <SelectItem key={committee.id} value={committee.id}>
                      {committee.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormDescription>
              審査を担当する委員会を選択してください（任意）
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="council_session_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>定例会</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="定例会を選択" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {councilSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}（{session.start_date}〜{session.end_date}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              議案が上程された定例会を選択してください
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="pdf_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>議案PDF URL</FormLabel>
            <FormControl>
              <Input
                type="url"
                placeholder="https://www.city.kawasaki.jp/..."
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormDescription>
              議案PDFのURLを入力してください（任意）。Web検索補完時にPDFの内容を参照します。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="is_featured"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>注目の議案</FormLabel>
              <FormDescription>
                トップページなどで優先的に表示されます
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
