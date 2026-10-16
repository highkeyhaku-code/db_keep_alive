import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ActivityIcon, Loader2Icon } from "lucide-react";
import { getProjects } from "@/actions/project";
import { AddProjectBtn } from "./_components/add-project-btn";
import { ProjectTable } from "./_components/project-table";

async function DashboardProjectsSection() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const projects = await getProjects();
  return <ProjectTable projects={projects} />;
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/40">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ActivityIcon className="size-4" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">
              Supabase Keep Alive
            </span>
          </div>
          <Suspense fallback={null}>
            <UserButton />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              プロジェクト管理
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              登録されたエンドポイントへ定期的にPingを送信し、自動一時停止（Pause）やスリープを防止します。
            </p>
          </div>
          <AddProjectBtn />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center rounded-xl border bg-card/50 py-16 text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              プロジェクト一覧を読み込み中...
            </div>
          }
        >
          <DashboardProjectsSection />
        </Suspense>
      </main>
    </div>
  );
}
