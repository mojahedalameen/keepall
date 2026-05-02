import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, subjectsTable, filesTable, audioRecordsTable, examsTable, tasksTable, notesTable, activityLogsTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import { requireAdmin, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats", requireAdmin, async (_req, res) => {
  const [users, subjects, files, audio, exams, tasks, notes] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(filesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(audioRecordsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(examsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable),
  ]);
  res.json({
    totalUsers: users[0].count,
    totalSubjects: subjects[0].count,
    totalFiles: files[0].count,
    totalAudioRecords: audio[0].count,
    totalExams: exams[0].count,
    totalTasks: tasks[0].count,
    totalNotes: notes[0].count,
  });
});

router.get("/users", requireAdmin, async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = (page - 1) * limit;

  const [allUsers, totalCount] = await Promise.all([
    db.select().from(usersTable).limit(limit).offset(offset).orderBy(desc(usersTable.createdAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
  ]);

  const userIds = allUsers.map(u => u.clerkId);
  const subjectCounts: Record<string, number> = {};
  const fileCounts: Record<string, number> = {};

  for (const uid of userIds) {
    const [sc] = await db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable).where(eq(subjectsTable.userId, uid));
    const [fc] = await db.select({ count: sql<number>`count(*)::int` }).from(filesTable).where(eq(filesTable.userId, uid));
    subjectCounts[uid] = sc.count;
    fileCounts[uid] = fc.count;
  }

  res.json({
    users: allUsers.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      subjectsCount: subjectCounts[u.clerkId] ?? 0,
      filesCount: fileCounts[u.clerkId] ?? 0,
    })),
    total: totalCount[0].count,
    page,
    limit,
  });
});

router.get("/users/:userId", requireAdmin, async (req, res) => {
  const userId = req.params.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const [subjects, files, notes, tasks] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable).where(eq(subjectsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(filesTable).where(eq(filesTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(eq(tasksTable.userId, userId)),
  ]);

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    subjectsCount: subjects[0].count,
    filesCount: files[0].count,
    notesCount: notes[0].count,
    tasksCount: tasks[0].count,
  });
});

router.patch("/users/:userId/toggle-active", requireAdmin, async (req, res) => {
  const userId = req.params.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(usersTable).set({ isActive: !user.isActive }).where(eq(usersTable.clerkId, userId)).returning();

  const [subjects, files, notes, tasks] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable).where(eq(subjectsTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(filesTable).where(eq(filesTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.userId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(eq(tasksTable.userId, userId)),
  ]);

  res.json({
    ...updated,
    createdAt: updated!.createdAt.toISOString(),
    subjectsCount: subjects[0].count,
    filesCount: files[0].count,
    notesCount: notes[0].count,
    tasksCount: tasks[0].count,
  });
});

router.get("/activity", requireAdmin, async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const offset = (page - 1) * limit;
  const logs = await db.select().from(activityLogsTable).orderBy(desc(activityLogsTable.createdAt)).limit(limit).offset(offset);
  res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
