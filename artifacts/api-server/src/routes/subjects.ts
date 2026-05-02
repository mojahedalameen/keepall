import { Router } from "express";
import { db } from "@workspace/db";
import { subjectsTable, notesTable, filesTable, lecturesTable, audioRecordsTable, examsTable, tasksTable, remindersTable } from "@workspace/db";
import { eq, and, sql, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateSubjectBody, UpdateSubjectBody, GetSubjectParams, UpdateSubjectParams, DeleteSubjectParams, GetSubjectStatsParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const semesterId = req.query.semesterId ? Number(req.query.semesterId) : undefined;
  const subjects = await db.select().from(subjectsTable).where(
    semesterId
      ? and(eq(subjectsTable.userId, userId), eq(subjectsTable.semesterId, semesterId))
      : eq(subjectsTable.userId, userId)
  );
  res.json(subjects);
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(subjectsTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json(created);
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetSubjectParams.parse(req.params);
  const [sub] = await db.select().from(subjectsTable).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId))).limit(1);
  if (!sub) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sub);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateSubjectParams.parse(req.params);
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(subjectsTable).set(parsed.data).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteSubjectParams.parse(req.params);
  await db.delete(subjectsTable).where(and(eq(subjectsTable.id, id), eq(subjectsTable.userId, userId)));
  res.status(204).send();
});

router.get("/:id/stats", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetSubjectStatsParams.parse(req.params);
  const [lectures, notes, files, audio, exams, tasks, reminders] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(lecturesTable).where(and(eq(lecturesTable.subjectId, id), eq(lecturesTable.userId, userId))),
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(and(eq(notesTable.subjectId, id), eq(notesTable.userId, userId), isNull(notesTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(filesTable).where(and(eq(filesTable.subjectId, id), eq(filesTable.userId, userId), isNull(filesTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(audioRecordsTable).where(and(eq(audioRecordsTable.subjectId, id), eq(audioRecordsTable.userId, userId))),
    db.select({ count: sql<number>`count(*)::int` }).from(examsTable).where(and(eq(examsTable.subjectId, id), eq(examsTable.userId, userId), isNull(examsTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(tasksTable).where(and(eq(tasksTable.subjectId, id), eq(tasksTable.userId, userId), isNull(tasksTable.deletedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(remindersTable).where(and(eq(remindersTable.subjectId, id), eq(remindersTable.userId, userId))),
  ]);
  res.json({
    lectures: lectures[0].count,
    notes: notes[0].count,
    files: files[0].count,
    audio: audio[0].count,
    exams: exams[0].count,
    tasks: tasks[0].count,
    reminders: reminders[0].count,
  });
});

export default router;
