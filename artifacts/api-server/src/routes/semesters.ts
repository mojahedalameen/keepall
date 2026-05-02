import { Router } from "express";
import { db } from "@workspace/db";
import { semestersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateSemesterBody, UpdateSemesterBody, GetSemesterParams, UpdateSemesterParams, DeleteSemesterParams, ActivateSemesterParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const semesters = await db.select().from(semestersTable).where(eq(semestersTable.userId, userId));
  res.json(semesters.map(s => ({ ...s, startDate: s.startDate ?? null, endDate: s.endDate ?? null })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateSemesterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { title, startDate, endDate, isActive } = parsed.data;
  if (isActive) {
    await db.update(semestersTable).set({ isActive: false }).where(eq(semestersTable.userId, userId));
  }
  const [created] = await db.insert(semestersTable).values({ userId, title, startDate: startDate ?? null, endDate: endDate ?? null, isActive: isActive ?? false }).returning();
  res.status(201).json(created);
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetSemesterParams.parse(req.params);
  const [sem] = await db.select().from(semestersTable).where(and(eq(semestersTable.id, id), eq(semestersTable.userId, userId))).limit(1);
  if (!sem) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sem);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateSemesterParams.parse(req.params);
  const parsed = UpdateSemesterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (parsed.data.isActive) {
    await db.update(semestersTable).set({ isActive: false }).where(eq(semestersTable.userId, userId));
  }
  const [updated] = await db.update(semestersTable).set(parsed.data).where(and(eq(semestersTable.id, id), eq(semestersTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteSemesterParams.parse(req.params);
  await db.delete(semestersTable).where(and(eq(semestersTable.id, id), eq(semestersTable.userId, userId)));
  res.status(204).send();
});

router.patch("/:id/activate", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = ActivateSemesterParams.parse(req.params);
  await db.update(semestersTable).set({ isActive: false }).where(eq(semestersTable.userId, userId));
  const [updated] = await db.update(semestersTable).set({ isActive: true }).where(and(eq(semestersTable.id, id), eq(semestersTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

export default router;
