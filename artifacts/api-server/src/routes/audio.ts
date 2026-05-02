import { Router } from "express";
import { db } from "@workspace/db";
import { audioRecordsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateAudioRecordBody, UpdateAudioRecordBody, GetAudioRecordParams, UpdateAudioRecordParams, DeleteAudioRecordParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const lectureId = req.query.lectureId ? Number(req.query.lectureId) : undefined;
  const conditions = [eq(audioRecordsTable.userId, userId)];
  if (subjectId) conditions.push(eq(audioRecordsTable.subjectId, subjectId));
  if (lectureId) conditions.push(eq(audioRecordsTable.lectureId, lectureId));
  const records = await db.select().from(audioRecordsTable).where(and(...conditions));
  res.json(records.map(r => ({ ...r, url: null })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateAudioRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(audioRecordsTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ ...created, url: null });
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetAudioRecordParams.parse(req.params);
  const [rec] = await db.select().from(audioRecordsTable).where(and(eq(audioRecordsTable.id, id), eq(audioRecordsTable.userId, userId))).limit(1);
  if (!rec) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...rec, url: null });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateAudioRecordParams.parse(req.params);
  const parsed = UpdateAudioRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(audioRecordsTable).set(parsed.data).where(and(eq(audioRecordsTable.id, id), eq(audioRecordsTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, url: null });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteAudioRecordParams.parse(req.params);
  await db.delete(audioRecordsTable).where(and(eq(audioRecordsTable.id, id), eq(audioRecordsTable.userId, userId)));
  res.status(204).send();
});

export default router;
