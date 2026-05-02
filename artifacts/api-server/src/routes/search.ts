import { Router } from "express";
import { db } from "@workspace/db";
import { subjectsTable, notesTable, filesTable, examsTable, tasksTable } from "@workspace/db";
import { eq, and, isNull, ilike, or } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const q = req.query.q as string;
  const type = req.query.type as string | undefined;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;

  if (!q || q.trim().length === 0) {
    res.json({ subjects: [], notes: [], files: [], exams: [], tasks: [] });
    return;
  }

  const pattern = `%${q}%`;

  const [subjects, notes, files, exams, tasks] = await Promise.all([
    (!type || type === "subjects")
      ? db.select().from(subjectsTable).where(and(
          eq(subjectsTable.userId, userId),
          or(ilike(subjectsTable.title, pattern), ilike(subjectsTable.code ?? "", pattern))
        )).limit(10)
      : Promise.resolve([]),
    (!type || type === "notes")
      ? db.select().from(notesTable).where(and(
          eq(notesTable.userId, userId),
          isNull(notesTable.deletedAt),
          subjectId ? eq(notesTable.subjectId, subjectId) : undefined,
          or(ilike(notesTable.title, pattern), ilike(notesTable.content ?? "", pattern))
        )).limit(10)
      : Promise.resolve([]),
    (!type || type === "files")
      ? db.select().from(filesTable).where(and(
          eq(filesTable.userId, userId),
          isNull(filesTable.deletedAt),
          subjectId ? eq(filesTable.subjectId, subjectId) : undefined,
          ilike(filesTable.name, pattern)
        )).limit(10)
      : Promise.resolve([]),
    (!type || type === "exams")
      ? db.select().from(examsTable).where(and(
          eq(examsTable.userId, userId),
          isNull(examsTable.deletedAt),
          subjectId ? eq(examsTable.subjectId, subjectId) : undefined,
          or(ilike(examsTable.notes ?? "", pattern), ilike(examsTable.instructor ?? "", pattern))
        )).limit(10)
      : Promise.resolve([]),
    (!type || type === "tasks")
      ? db.select().from(tasksTable).where(and(
          eq(tasksTable.userId, userId),
          isNull(tasksTable.deletedAt),
          subjectId ? eq(tasksTable.subjectId, subjectId) : undefined,
          or(ilike(tasksTable.title, pattern), ilike(tasksTable.description ?? "", pattern))
        )).limit(10)
      : Promise.resolve([]),
  ]);

  res.json({
    subjects,
    notes: notes.map((n: typeof notesTable.$inferSelect) => ({ ...n, tags: n.tags ?? [], deletedAt: n.deletedAt?.toISOString() ?? null })),
    files: files.map((f: typeof filesTable.$inferSelect) => ({ ...f, url: null, deletedAt: f.deletedAt?.toISOString() ?? null })),
    exams: exams.map((e: typeof examsTable.$inferSelect) => ({ ...e, deletedAt: e.deletedAt?.toISOString() ?? null })),
    tasks: tasks.map((t: typeof tasksTable.$inferSelect) => ({ ...t, deletedAt: t.deletedAt?.toISOString() ?? null })),
  });
});

export default router;
