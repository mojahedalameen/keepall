import { Router } from "express";
import { db } from "@workspace/db";
import { remindersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateReminderBody, UpdateReminderBody, UpdateReminderParams, DeleteReminderParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const conditions = [eq(remindersTable.userId, userId)];
  if (subjectId) conditions.push(eq(remindersTable.subjectId, subjectId));
  const reminders = await db.select().from(remindersTable).where(and(...conditions));
  res.json(reminders);
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(remindersTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json(created);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateReminderParams.parse(req.params);
  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(remindersTable).set(parsed.data).where(and(eq(remindersTable.id, id), eq(remindersTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteReminderParams.parse(req.params);
  await db.delete(remindersTable).where(and(eq(remindersTable.id, id), eq(remindersTable.userId, userId)));
  res.status(204).send();
});

export default router;
