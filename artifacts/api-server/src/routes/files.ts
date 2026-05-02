import { Router } from "express";
import { db } from "@workspace/db";
import { filesTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateFileRecordBody, UpdateFileBody, GetFileUploadUrlBody, GetFileParams, UpdateFileParams, DeleteFileParams } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const lectureId = req.query.lectureId ? Number(req.query.lectureId) : undefined;
  const conditions = [eq(filesTable.userId, userId), isNull(filesTable.deletedAt)];
  if (subjectId) conditions.push(eq(filesTable.subjectId, subjectId));
  if (lectureId) conditions.push(eq(filesTable.lectureId, lectureId));
  const files = await db.select().from(filesTable).where(and(...conditions));
  res.json(files.map(f => ({ ...f, url: null, deletedAt: f.deletedAt?.toISOString() ?? null })));
});

router.post("/upload-url", requireAuth, async (req, res) => {
  const parsed = GetFileUploadUrlBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { filename, contentType } = parsed.data;
  const storageKey = `${(req as AuthedRequest).userId}/${Date.now()}-${crypto.randomUUID()}-${filename}`;
  // Return a placeholder URL — in production this would be a presigned S3/storage URL
  // For now we store files via direct upload to the storage key
  res.json({ uploadUrl: `/api/files/upload/${encodeURIComponent(storageKey)}`, storageKey });
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateFileRecordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(filesTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ ...created, url: null, deletedAt: null });
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetFileParams.parse(req.params);
  const [file] = await db.select().from(filesTable).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId))).limit(1);
  if (!file) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...file, url: null, deletedAt: file.deletedAt?.toISOString() ?? null });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateFileParams.parse(req.params);
  const parsed = UpdateFileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(filesTable).set(parsed.data).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, url: null, deletedAt: updated.deletedAt?.toISOString() ?? null });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteFileParams.parse(req.params);
  await db.update(filesTable).set({ deletedAt: new Date() }).where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)));
  res.status(204).send();
});

export default router;
