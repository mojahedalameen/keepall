import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth";
import { UpdateProfileBody } from "@workspace/api-zod";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.patch("/", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).userId;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.clerkId, userId)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
