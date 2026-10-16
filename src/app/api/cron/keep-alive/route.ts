import { and, eq, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { decrypt } from "@/lib/utils/crypto";

interface PingResult {
  id: string;
  name: string;
  statusCode: number;
  success: boolean;
  nextPingAt: string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const targetProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.isActive, true), lte(projects.nextPingAt, now)));

  const results: PingResult[] = [];

  for (const project of targetProjects) {
    const pingTime = new Date();
    let statusCode = 500;
    let errorMessage: string | undefined;

    try {
      const apiKey = decrypt(
        project.encryptedApiKey,
        project.iv,
        project.authTag
      );

      const headers: HeadersInit = {
        apikey: apiKey,
      };

      if (apiKey.startsWith("eyJ")) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const response = await fetch(project.targetUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      statusCode = response.status;
    } catch (error) {
      statusCode = 500;
      errorMessage =
        error instanceof Error ? error.message : "Unknown fetch error";
    }

    const isSuccess = statusCode >= 200 && statusCode < 300;
    const nextPingAt = isSuccess
      ? new Date(
          pingTime.getTime() + project.pingIntervalDays * 24 * 60 * 60 * 1000
        )
      : project.nextPingAt;

    await db
      .update(projects)
      .set({
        lastPingAt: pingTime,
        lastStatusCode: statusCode,
        nextPingAt,
        updatedAt: pingTime,
      })
      .where(eq(projects.id, project.id));

    results.push({
      id: project.id,
      name: project.name,
      statusCode,
      success: isSuccess,
      nextPingAt: nextPingAt.toISOString(),
      ...(errorMessage ? { error: errorMessage } : {}),
    });
  }

  if (results.length > 0) {
    revalidatePath("/dashboard");
  }

  const succeededCount = results.filter((r) => r.success).length;
  const failedCount = results.length - succeededCount;

  return NextResponse.json(
    {
      ok: true,
      processedCount: results.length,
      succeededCount,
      failedCount,
      results,
    },
    { status: 200 }
  );
}
