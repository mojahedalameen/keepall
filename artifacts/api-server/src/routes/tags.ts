import { Router } from "express";
import { db } from "@workspace/db";
import { tagsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { CreateTagBody, DeleteTagParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const tags = await db.select().from(tagsTable).where(eq(tagsTable.userId, userId));
  res.json(tags);
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [created] = await db.insert(tagsTable).values({ userId, ...parsed.data }).returning();
  res.status(201).json(created);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const { id } = DeleteTagParams.parse(req.params);
  await db.delete(tagsTable).where(and(eq(tagsTable.id, id), eq(tagsTable.userId, userId)));
  res.status(204).send();
});

export default router;
