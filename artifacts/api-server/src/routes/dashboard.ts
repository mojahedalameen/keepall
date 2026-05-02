import { Router } from "express";
import { db } from "@workspace/db";
import {
  subjectsTable, notesTable, filesTable, tasksTable,
  remindersTable, semestersTable, audioRecordsTable, examsTable,
} from "@workspace/db";
import { eq, and, isNull, sql, asc } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const [subjects, notes, files, tasks, pendingTasks, reminders, activeSemester] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable).where(eq(subjectsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(and(eq(notesTable.userId, userId), isNull(notesTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(filesTable).where(and(eq(filesTable.userId, userId), isNull(filesTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.userId, userId), isNull(tasksTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.userId, userId), isNull(tasksTable.deletedAt), eq(tasksTable.status, "pending"))),
    db.select({ count: sql<number>`count(*)::int` }).from(remindersTable).where(and(eq(remindersTable.userId, userId), eq(remindersTable.isRead, false))),
    db.select().from(semestersTable).where(and(eq(semestersTable.userId, userId), eq(semestersTable.isActive, true))).limit(1),
  ]);
  res.json({
    totalSubjects: subjects[0].count,
    totalNotes: notes[0].count,
    totalFiles: files[0].count,
    totalTasks: tasks[0].count,
    pendingTasks: pendingTasks[0].count,
    upcomingReminders: reminders[0].count,
    activeSemester: activeSemester[0] ?? null,
  });
});

router.get("/upcoming", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const [tasks, reminders] = await Promise.all([
    db.select().from(tasksTable)
      .where(and(eq(tasksTable.userId, userId), isNull(tasksTable.deletedAt), eq(tasksTable.status, "pending")))
      .orderBy(asc(tasksTable.dueDate))
      .limit(5),
    db.select().from(remindersTable)
      .where(and(eq(remindersTable.userId, userId), eq(remindersTable.isRead, false)))
      .orderBy(asc(remindersTable.remindAt))
      .limit(5),
  ]);
  res.json({ tasks, reminders });
});

router.get("/recent-files", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const files = await db.select().from(filesTable)
    .where(and(eq(filesTable.userId, userId), isNull(filesTable.deletedAt)))
    .orderBy(sql`${filesTable.createdAt} DESC`)
    .limit(6);
  res.json(files.map(f => ({ ...f, url: null })));
});

router.get("/recent-notes", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const notes = await db.select().from(notesTable)
    .where(and(eq(notesTable.userId, userId), isNull(notesTable.deletedAt)))
    .orderBy(sql`${notesTable.updatedAt} DESC`)
    .limit(6);
  res.json(notes.map(n => ({ ...n, tags: n.tags ?? [] })));
});

export default router;
