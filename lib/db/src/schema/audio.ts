import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { subjectsTable } from "./subjects";
import { lecturesTable } from "./lectures";

export const audioRecordsTable = pgTable("audio_records", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.clerkId, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjectsTable.id, { onDelete: "cascade" }),
  lectureId: integer("lecture_id").references(() => lecturesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  duration: integer("duration"),
  description: text("description"),
  transcript: text("transcript"),
  storageKey: text("storage_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAudioRecordSchema = createInsertSchema(audioRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAudioRecord = z.infer<typeof insertAudioRecordSchema>;
export type AudioRecord = typeof audioRecordsTable.$inferSelect;
