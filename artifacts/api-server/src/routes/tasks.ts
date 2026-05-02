import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateTaskBody, UpdateTaskBody, UpdateTaskStatusBody, GetTaskParams, UpdateTaskParams, DeleteTaskParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
  const status = req.query.status as string | undefined;
  const conditions = [eq(tasksTable.userId, userId), isNull(tasksTable.deletedAt)];
  if (subjectId) conditions.push(eq(tasksTable.subjectId, subjectId));
  if (status) conditions.push(eq(tasksTable.status, status));
  const tasks = await db.select().from(tasksTable).where(and(...conditions));
  res.json(tasks.map(t => ({ ...t, deletedAt: t.deletedAt?.toISOString() ?? null })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(tasksTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json({ ...created, deletedAt: null });
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = GetTaskParams.parse(req.params);
  const [task] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).limit(1);
  if (!task) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...task, deletedAt: task.deletedAt?.toISOString() ?? null });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = UpdateTaskParams.parse(req.params);
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(tasksTable).set(parsed.data).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, deletedAt: updated.deletedAt?.toISOString() ?? null });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteTaskParams.parse(req.params);
  await db.update(tasksTable).set({ deletedAt: new Date() }).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  res.status(204).send();
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const id = Number(req.params.id);
  const parsed = UpdateTaskStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(tasksTable).set({ status: parsed.data.status }).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, deletedAt: updated.deletedAt?.toISOString() ?? null });
});

export default router;
