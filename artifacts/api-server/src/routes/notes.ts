import { Router } from "express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, and, isNull, isNotNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateNoteBody, UpdateNoteBody, GetNoteParams, UpdateNoteParams, DeleteNoteParams, ToggleNotePinParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const lectureId = req.query.lectureId ? Number(req.query.lectureId) : undefined;
  const pinned = req.query.pinned !== undefined ? req.query.pinned === "true" : undefined;

  const conditions = [eq(notesTable.userId, userId), isNull(notesTable.deletedAt)];
  if (subjectId) conditions.push(eq(notesTable.subjectId, subjectId));
  if (lectureId) conditions.push(eq(notesTable.lectureId, lectureId));
  if (pinned !== undefined) conditions.push(eq(notesTable.isPinned, pinned));

  const notes = await db.select().from(notesTable).where(and(...conditions));
  res.json(notes.map(n => ({ ...n, tags: n.tags ?? [], deletedAt: n.deletedAt?.toISOString() ?? null })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(notesTable).values({ userId, ...parsed.data, tags: parsed.data.tags ?? [] }).returning();
  res.status(201).json({ ...created, tags: created.tags ?? [], deletedAt: null });
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetNoteParams.parse(req.params);
  const [note] = await db.select().from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId))).limit(1);
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...note, tags: note.tags ?? [], deletedAt: note.deletedAt?.toISOString() ?? null });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateNoteParams.parse(req.params);
  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(notesTable).set({ ...parsed.data, updatedAt: new Date() }).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, tags: updated.tags ?? [], deletedAt: updated.deletedAt?.toISOString() ?? null });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteNoteParams.parse(req.params);
  await db.update(notesTable).set({ deletedAt: new Date() }).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  res.status(204).send();
});

router.patch("/:id/pin", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = ToggleNotePinParams.parse(req.params);
  const [note] = await db.select().from(notesTable).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId))).limit(1);
  if (!note) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(notesTable).set({ isPinned: !note.isPinned }).where(and(eq(notesTable.id, id), eq(notesTable.userId, userId))).returning();
  res.json({ ...updated, tags: updated!.tags ?? [], deletedAt: updated!.deletedAt?.toISOString() ?? null });
});

export default router;
