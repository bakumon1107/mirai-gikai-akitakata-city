"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import type { Committee } from "@/features/committees/shared/types";
import type { CouncilSession } from "@/features/council-sessions/shared/types";
import { utcToJstDatetimeLocal } from "@/lib/utils/datetime-jst";
import { createBill } from "../../server/actions/create-bill";
import { type BillCreateInput, billCreateSchema } from "../../shared/types";
import { useBillForm } from "../hooks/use-bill-form";
import { BillFormFields } from "./bill-form-fields";

interface BillCreateFormProps {
  councilSessions: CouncilSession[];
  committees: Committee[];
}

export function BillCreateForm({
  councilSessions,
  committees,
}: BillCreateFormProps) {
  const { isSubmitting, error, handleSubmit, handleCancel } = useBillForm();

  // Default to the latest session (first in the list, sorted by start_date desc)
  const defaultCouncilSessionId =
    councilSessions.length > 0 ? councilSessions[0].id : null;

  const form = useForm<BillCreateInput>({
    resolver: zodResolver(billCreateSchema),
    defaultValues: {
      bill_number: "",
      name: "",
      status: "preparing",
      status_note: null,
      published_at: utcToJstDatetimeLocal(new Date().toISOString()),
      thumbnail_url: null,
      share_thumbnail_url: null,
      is_featured: false,
      council_session_id: defaultCouncilSessionId,
      pdf_url: null,
    },
  });

  const onSubmit = (data: BillCreateInput) => {
    handleSubmit(() => createBill(data), "作成中にエラーが発生しました");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>議案新規作成</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BillFormFields
              control={form.control}
              councilSessions={councilSessions}
              committees={committees}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "作成"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
