"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { type Project, projects } from "@/lib/db/schema";
import { encrypt } from "@/lib/utils/crypto";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  targetUrl: z.string().url("Target URL must be a valid URL"),
  apiKey: z.string().min(1, "API key is required"),
  pingIntervalDays: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  nextPingAt: z.date().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").optional(),
  targetUrl: z.string().url("Target URL must be a valid URL").optional(),
  apiKey: z.string().optional(),
  pingIntervalDays: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
  nextPingAt: z.date().optional(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;

/**
 * Clerk認証からログイン中の userId を取得する認可ガード
 */
async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * ログインユーザーの全プロジェクトを取得する（APIキーは暗号化されたまま返す）
 */
export async function getProjects(): Promise<Project[]> {
  const userId = await requireUserId();

  return await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

/**
 * 新規プロジェクトを作成する（APIキーをAES-256-GCMで暗号化して保存）
 */
export async function createProject(
  data: CreateProjectInput
): Promise<Project> {
  const userId = await requireUserId();
  const parsed = createProjectSchema.parse(data);

  const { encryptedText, iv, authTag } = encrypt(parsed.apiKey);
  const nextPingAt = parsed.nextPingAt ?? new Date();

  const [created] = await db
    .insert(projects)
    .values({
      userId,
      name: parsed.name,
      targetUrl: parsed.targetUrl,
      encryptedApiKey: encryptedText,
      iv,
      authTag,
      isActive: parsed.isActive,
      pingIntervalDays: parsed.pingIntervalDays,
      nextPingAt,
    })
    .returning();

  revalidatePath("/dashboard");
  return created;
}

/**
 * 既存プロジェクトの情報を更新する（APIキーが含まれる場合は再暗号化）
 */
export async function updateProject(
  id: string,
  data: UpdateProjectInput
): Promise<Project> {
  const userId = await requireUserId();
  const parsed = updateProjectSchema.parse(data);

  const updateValues: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.name !== undefined) {
    updateValues.name = parsed.name;
  }
  if (parsed.targetUrl !== undefined) {
    updateValues.targetUrl = parsed.targetUrl;
  }
  if (parsed.pingIntervalDays !== undefined) {
    updateValues.pingIntervalDays = parsed.pingIntervalDays;
  }
  if (parsed.isActive !== undefined) {
    updateValues.isActive = parsed.isActive;
  }
  if (parsed.nextPingAt !== undefined) {
    updateValues.nextPingAt = parsed.nextPingAt;
  }
  if (parsed.apiKey !== undefined && parsed.apiKey.trim() !== "") {
    const { encryptedText, iv, authTag } = encrypt(parsed.apiKey);
    updateValues.encryptedApiKey = encryptedText;
    updateValues.iv = iv;
    updateValues.authTag = authTag;
  }

  const [updated] = await db
    .update(projects)
    .set(updateValues)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Project not found or unauthorized");
  }

  revalidatePath("/dashboard");
  return updated;
}

/**
 * 指定されたプロジェクトを削除する
 */
export async function deleteProject(id: string): Promise<void> {
  const userId = await requireUserId();

  const [deleted] = await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning({ id: projects.id });

  if (!deleted) {
    throw new Error("Project not found or unauthorized");
  }

  revalidatePath("/dashboard");
}

/**
 * プロジェクトの有効/無効（is_active）を切り替える
 */
export async function toggleProjectStatus(
  id: string,
  isActive: boolean
): Promise<Project> {
  const userId = await requireUserId();

  const [updated] = await db
    .update(projects)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Project not found or unauthorized");
  }

  revalidatePath("/dashboard");
  return updated;
}
