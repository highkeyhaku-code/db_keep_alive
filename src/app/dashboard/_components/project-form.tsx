"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2Icon } from "lucide-react";
import { createProject, updateProject } from "@/actions/project";
import type { Project } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const projectFormSchema = z.object({
  name: z.string().min(1, "プロジェクト名を入力してください"),
  targetUrl: z.string().url("有効なURL（https://...）を入力してください"),
  apiKey: z.string(),
  pingIntervalDays: z
    .number({ message: "数値を入力してください" })
    .int("整数を入力してください")
    .min(1, "1日以上の間隔を指定してください")
    .max(365, "365日以下で指定してください"),
  isActive: z.boolean(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({
  project,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const isEditing = Boolean(project);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name ?? "",
      targetUrl: project?.targetUrl ?? "",
      apiKey: "",
      pingIntervalDays: project?.pingIntervalDays ?? 1,
      isActive: project?.isActive ?? true,
    },
  });

  function onSubmit(values: ProjectFormValues) {
    setServerError(null);

    if (!isEditing && !values.apiKey.trim()) {
      form.setError("apiKey", {
        type: "manual",
        message: "新規作成時はAPIキーの入力が必須です",
      });
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && project) {
          await updateProject(project.id, {
            name: values.name.trim(),
            targetUrl: values.targetUrl.trim(),
            apiKey: values.apiKey.trim() ? values.apiKey.trim() : undefined,
            pingIntervalDays: values.pingIntervalDays,
            isActive: values.isActive,
          });
        } else {
          await createProject({
            name: values.name.trim(),
            targetUrl: values.targetUrl.trim(),
            apiKey: values.apiKey.trim(),
            pingIntervalDays: values.pingIntervalDays,
            isActive: values.isActive,
          });
        }
        onSuccess?.();
      } catch (err) {
        setServerError(
          err instanceof Error
            ? err.message
            : "保存中にエラーが発生しました。もう一度お試しください。"
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>プロジェクト名</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: Production Supabase DB"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>対象エンドポイントURL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://xxxx.supabase.co/rest/v1/"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                定期Pingを送信するHTTPエンドポイントのURLを入力してください。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                APIキー (Anon Key / Bearer Token)
                {isEditing && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    （変更する場合のみ入力）
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={
                    isEditing
                      ? "••••••••••••••••（空欄のままにすると現在のキーを維持）"
                      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                  autoComplete="off"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                AES-256-GCMで暗号化されてデータベースに保存されます。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pingIntervalDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ping実行間隔（日数）</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  disabled={isPending}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? Number.NaN : Number(val));
                  }}
                />
              </FormControl>
              <FormDescription>
                何日に1回Pingを実行するかを指定します（デフォルト: 1日）。
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel>定期Pingを有効にする</FormLabel>
                <FormDescription>
                  オフにするとスケジュール実行の対象外になります。
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              キャンセル
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2Icon className="mr-1.5 size-4 animate-spin" />}
            {isEditing ? "変更を保存" : "プロジェクトを追加"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
