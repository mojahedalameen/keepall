import { Router } from "express";
import { db } from "@workspace/db";
import { lecturesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateLectureBody, UpdateLectureBody, GetLectureParams, UpdateLectureParams, DeleteLectureParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  if (!subjectId) { res.status(400).json({ error: "subjectId required" }); return; }
  const lectures = await db.select().from(lecturesTable).where(and(eq(lecturesTable.userId, userId), eq(lecturesTable.subjectId, subjectId)));
  res.json(lectures);
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateLectureBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(lecturesTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json(created);
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetLectureParams.parse(req.params);
  const [lec] = await db.select().from(lecturesTable).where(and(eq(lecturesTable.id, id), eq(lecturesTable.userId, userId))).limit(1);
  if (!lec) { res.status(404).json({ error: "Not found" }); return; }
  res.json(lec);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateLectureParams.parse(req.params);
  const parsed = UpdateLectureBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(lecturesTable).set(parsed.data).where(and(eq(lecturesTable.id, id), eq(lecturesTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteLectureParams.parse(req.params);
  await db.delete(lecturesTable).where(and(eq(lecturesTable.id, id), eq(lecturesTable.userId, userId)));
  res.status(204).send();
});

export default router;
