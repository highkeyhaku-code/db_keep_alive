import { Suspense } from "react";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ActivityIcon, ArrowRightIcon, ShieldCheckIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function AuthRedirectCheck() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return null;
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense fallback={null}>
        <AuthRedirectCheck />
      </Suspense>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center">
          <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ActivityIcon className="size-7" />
          </div>

          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheckIcon className="size-3.5 text-primary" />
            AES-256-GCM 暗号化による安全なAPIキー管理
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Supabase Keep Alive
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Vercel PostgresやSupabaseの無料枠プロジェクトをスリープから守る、自動Ping監視ダッシュボード。
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Suspense
              fallback={
                <span
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 px-6 text-sm"
                  )}
                >
                  ログインして始める
                  <ArrowRightIcon className="ml-1.5 size-4" />
                </span>
              }
            >
              <SignInButton fallbackRedirectUrl="/dashboard">
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 cursor-pointer px-6 text-sm"
                  )}
                >
                  ログインして始める
                  <ArrowRightIcon className="ml-1.5 size-4" />
                </button>
              </SignInButton>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
