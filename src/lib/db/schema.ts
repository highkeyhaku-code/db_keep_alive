import { pgTable, uuid, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  targetUrl: text("target_url").notNull(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  iv: text("iv").notNull(),
  authTag: text("auth_tag").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  pingIntervalDays: integer("ping_interval_days").default(1).notNull(),
  nextPingAt: timestamp("next_ping_at", { withTimezone: true, mode: "date" }).notNull(),
  lastPingAt: timestamp("last_ping_at", { withTimezone: true, mode: "date" }),
  lastStatusCode: integer("last_status_code"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
