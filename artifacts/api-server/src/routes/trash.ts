import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable, filesTable, tasksTable, examsTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { RestoreTrashItemBody, PurgeTrashItemBody } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const [notes, files, tasks, exams] = await Promise.all([
    db.select().from(notesTable).where(and(eq(notesTable.userId, userId), isNotNull(notesTable.deletedAt))),
    db.select().from(filesTable).where(and(eq(filesTable.userId, userId), isNotNull(filesTable.deletedAt))),
    db.select().from(tasksTable).where(and(eq(tasksTable.userId, userId), isNotNull(tasksTable.deletedAt))),
    db.select().from(examsTable).where(and(eq(examsTable.userId, userId), isNotNull(examsTable.deletedAt))),
  ]);
  res.json({
    notes: notes.map(n => ({ ...n, tags: n.tags ?? [], deletedAt: n.deletedAt?.toISOString() ?? null })),
    files: files.map(f => ({ ...f, url: null, deletedAt: f.deletedAt?.toISOString() ?? null })),
    tasks: tasks.map(t => ({ ...t, deletedAt: t.deletedAt?.toISOString() ?? null })),
    exams: exams.map(e => ({ ...e, deletedAt: e.deletedAt?.toISOString() ?? null })),
  });
});

router.post("/restore", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = RestoreTrashItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { type, id } = parsed.data;
  if (type === "note") await db.update(notesTable).set({ deletedAt: null }).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  else if (type === "file") await db.update(filesTable).set({ deletedAt: null }).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));
  else if (type === "task") await db.update(tasksTable).set({ deletedAt: null }).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  else if (type === "exam") await db.update(examsTable).set({ deletedAt: null }).where(and(eq(examsTable.id, id), eq(examsTable.userId, userId)));
  res.json({ success: true });
});

router.delete("/purge", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = PurgeTrashItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { type, id } = parsed.data;
  if (type === "note") await db.delete(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  else if (type === "file") await db.delete(filesTable).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));
  else if (type === "task") await db.delete(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  else if (type === "exam") await db.delete(examsTable).where(and(eq(examsTable.id, id), eq(examsTable.userId, userId)));
  res.status(204).send();
});

export default router;
