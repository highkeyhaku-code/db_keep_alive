"use client";

import { useState, useTransition } from "react";
import {
  ExternalLinkIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  ServerIcon,
  Trash2Icon,
} from "lucide-react";
import { deleteProject, toggleProjectStatus } from "@/actions/project";
import type { Project } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectForm } from "./project-form";

interface ProjectTableProps {
  projects: Project[];
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function StatusBadge({ statusCode }: { statusCode: number | null }) {
  if (statusCode === null || statusCode === undefined) {
    return (
      <Badge
        variant="secondary"
        className="bg-muted text-muted-foreground border-border"
      >
        未実行
      </Badge>
    );
  }

  if (statusCode >= 200 && statusCode < 300) {
    return (
      <Badge
        variant="outline"
        className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      >
        {statusCode} OK
      </Badge>
    );
  }

  return <Badge variant="destructive">{statusCode} Error</Badge>;
}

export function ProjectTable({ projects }: ProjectTableProps) {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [isToggling, startToggleTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleToggleStatus(project: Project, checked: boolean) {
    setPendingToggleId(project.id);
    startToggleTransition(async () => {
      try {
        await toggleProjectStatus(project.id, checked);
      } finally {
        setPendingToggleId(null);
      }
    });
  }

  function handleConfirmDelete() {
    if (!deletingProject) return;
    const targetId = deletingProject.id;
    startDeleteTransition(async () => {
      try {
        await deleteProject(targetId);
        setDeletingProject(null);
      } catch (error) {
        console.error("Failed to delete project:", error);
      }
    });
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <ServerIcon className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium text-foreground">
          登録されているプロジェクトがありません
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          右上の「プロジェクト追加」ボタンから、自動一時停止（Pause）やスリープを防ぎたいSupabase等のエンドポイントを登録してください。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">プロジェクト名</TableHead>
              <TableHead>ターゲットURL</TableHead>
              <TableHead>実行頻度</TableHead>
              <TableHead>次回Ping予定日時</TableHead>
              <TableHead>最終ステータス</TableHead>
              <TableHead>有効 / 無効</TableHead>
              <TableHead className="pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => {
              const isRowToggling =
                isToggling && pendingToggleId === project.id;

              return (
                <TableRow key={project.id}>
                  <TableCell className="pl-4 font-medium">
                    {project.name}
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={project.targetUrl}
                      className="inline-flex max-w-full items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span className="truncate">{project.targetUrl}</span>
                      <ExternalLinkIcon className="size-3 shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell>{project.pingIntervalDays}日ごと</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{formatDateTime(project.nextPingAt)}</div>
                    {project.lastPingAt && (
                      <div className="text-[11px] text-muted-foreground/75">
                        最終: {formatDateTime(project.lastPingAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge statusCode={project.lastStatusCode} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={project.isActive}
                        disabled={isRowToggling}
                        onCheckedChange={(checked) =>
                          handleToggleStatus(project, checked)
                        }
                        aria-label={`${project.name} の有効/無効を切り替え`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {project.isActive ? "ON" : "OFF"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="操作メニューを開く"
                          />
                        }
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingProject(project)}
                        >
                          <PencilIcon className="mr-1.5 size-4" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeletingProject(project)}
                        >
                          <Trash2Icon className="mr-1.5 size-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 編集モーダル */}
      <Dialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open) setEditingProject(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>プロジェクトの編集</DialogTitle>
            <DialogDescription>
              プロジェクトの設定を更新します。APIキーを変更しない場合は空欄のままにしてください。
            </DialogDescription>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              key={editingProject.id}
              project={editingProject}
              onSuccess={() => setEditingProject(null)}
              onCancel={() => setEditingProject(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 削除確認モーダル */}
      <Dialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingProject(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>プロジェクトの削除</DialogTitle>
            <DialogDescription>
              「{deletingProject?.name}」を削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingProject(null)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2Icon className="mr-1.5 size-4 animate-spin" />
              )}
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
