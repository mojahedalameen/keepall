import { Router } from "express";
import { db } from "@workspace/db";
import { examsTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateExamBody, UpdateExamBody, GetExamParams, UpdateExamParams, DeleteExamParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const conditions = [eq(examsTable.userId, userId), isNull(examsTable.deletedAt)];
  if (subjectId) conditions.push(eq(examsTable.subjectId, subjectId));
  const exams = await db.select().from(examsTable).where(and(...conditions));
  res.json(exams.map(e => ({ ...e, deletedAt: e.deletedAt?.toISOString() ?? null })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(examsTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ ...created, deletedAt: null });
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetExamParams.parse(req.params);
  const [exam] = await db.select().from(examsTable).where(and(eq(examsTable.id, id), eq(examsTable.userId, userId))).limit(1);
  if (!exam) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...exam, deletedAt: exam.deletedAt?.toISOString() ?? null });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateExamParams.parse(req.params);
  const parsed = UpdateExamBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(examsTable).set(parsed.data).where(and(eq(examsTable.id, id), eq(examsTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, deletedAt: updated.deletedAt?.toISOString() ?? null });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteExamParams.parse(req.params);
  await db.update(examsTable).set({ deletedAt: new Date() }).where(and(eq(examsTable.id, id), eq(examsTable.userId, userId)));
  res.status(204).send();
});

export default router;
